import { PLAYER_X, COUNTER_HEIGHT_PX } from '../game/constants.js'
import { patronPortrait, patronHeld, patronWalkSheet } from '../game/art.js'

// Glows red once a still-walking customer gets close to the end of
// the bar, as a warning — replaces the old patience-timer bar since
// customers no longer stop and wait; they just keep coming.
const DANGER_X = PLAYER_X + 22

// Patron illustrations, one row per patronType (picked at spawn — see
// PATRON_TYPE_WEIGHTS in constants.js) and one column per drink type.
// They face left, the direction they walk in, and keep facing that way
// throughout — a served customer is shoved backwards by the drink rather
// than turning round, so nothing is ever mirrored.
//
// Every patron's art is built by tools/patron_rig from ONE source portrait:
// the walk is that portrait with its legs swung by a cut-out rig, pink is a
// recolour of the same pixels, and the held-drink pose is the same figure
// with the glass in its hand. So the orange and pink versions are always
// the same person, and every file shares one canvas — swapping walk for
// held never jogs the figure.
//
// To add a patron: add them to tools/patron_rig/characters.py, run its
// build.py, add a row here with the canvas size and ground it prints, and
// add a weight to PATRON_TYPE_WEIGHTS in constants.js.
//
// Every figure is drawn 267px tall on a 279px canvas, so one height puts
// the whole roster at the same scale.
const PATRON_HEIGHT = 89

// Each entry's aspectRatio (canvas width / height) keeps the sprite from
// stretching at PATRON_HEIGHT.
//
// `ground` is how far one walk cycle carries the figure, as a fraction of
// its height: the backward travel of whichever foot is planted, added up
// over the cycle. tools/patron_rig/build.py measures it off the rig and
// prints it. It's what times the legs — see walkCycleMs().
const sheets = (patronType, width, ground) => [
  { src: patronWalkSheet(patronType, 0), aspectRatio: width / 279, ground },
  { src: patronWalkSheet(patronType, 1), aspectRatio: width / 279, ground },
]
const PATRON_WALK_SHEETS = {
  0: sheets(0, 191, 0.436),
  1: sheets(1, 294, 0.237),
  2: sheets(2, 201, 0.427),
  3: sheets(3, 202, 0.251),
  4: sheets(4, 196, 0.471),
  5: sheets(5, 171, 0.496),
  6: sheets(6, 187, 0.456),
  7: sheets(7, 200, 0.357),
  8: sheets(8, 227, 0.192),
  9: sheets(9, 206, 0.537),
  10: sheets(10, 192, 0.211),
  11: sheets(11, 158, 0.32),
}

// The legs have to cycle so that, over one cycle, the body moves exactly
// as far as the planted foot pushes it — then that foot stays put on the
// floor. Cycle too fast and the foot slides backwards under them, which
// reads as walking backwards; too slow and they skate.
//
// That's a straight distance-over-speed sum: the ground one cycle covers
// (in px, from `ground` at PATRON_HEIGHT) over how fast they're walking (in
// px/s, which needs the lane's actual width on screen, since positions
// are percentages of it). An earlier version scaled everything off one
// patron that looked right on one screen size instead, and every walk
// came out about 1.5x too fast.
function walkCycleMs(sheet, laneWidthPx, speed) {
  if (!speed || !laneWidthPx) return 900
  const pxPerSecond = (Math.abs(speed) / 100) * laneWidthPx
  const ms = ((sheet.ground * PATRON_HEIGHT) / pxPerSecond) * 1000
  // Keep it inside a believable gait even if a level speed goes to an
  // extreme. The floor is roughly eight frames at 60fps — below that the
  // browser drops frames anyway, so a lower number buys nothing and only
  // lets the feet slip.
  return Math.max(140, Math.min(1800, ms))
}

// `still`: walking, but not going anywhere right now — a mid-walk hitch, or
// the whole game frozen behind a screen. The legs stop too, or they'd walk
// on the spot, which reads as walking backwards.
export default function Customer({ x, drinkType, patronType, status, drinkName, speed, laneWidthPx, still }) {
  const isUrgent = status === 'walking' && x <= DANGER_X
  // Caught the drink and now sliding back from it. They keep
  // facing the bartender the whole way — they're being shoved, not walking
  // out — so there's no mirroring and no walk cycle, which is what every
  // version of the backwards-walking bug came from. A shove has no gait.
  const isLeaving = status === 'leaving-happy'
  const isToasting = status === 'toasting'
  const isDrinking = status === 'drinking'
  // Turned round to watch the dachshund's show. They're standing still,
  // so the portrait can simply be mirrored — there's no gait to go wrong.
  const isWatching = status === 'watching'
  // The impact beat, the slide and the drink itself all show them holding
  // what they caught.
  const heldSrc = isToasting || isLeaving || isDrinking ? patronHeld(patronType, drinkType) : null
  const walkSheet = status === 'walking' ? PATRON_WALK_SHEETS[patronType]?.[drinkType] : null

  return (
    <div
      className="absolute z-10 customer-emerge"
      style={{
        left: `${x}%`,
        top: `calc(50% + ${COUNTER_HEIGHT_PX / 2}px)`,
        transform: 'translate(-50%, -100%)',
        // No ghosting any more. That cue meant "already served, don't throw
        // at me", which stopped being true once a shove that falls short
        // sends them back for another drink — they're a live customer
        // again. Sliding backwards with a drink in hand says it by itself.
        filter: isUrgent ? 'drop-shadow(0 0 5px #7A1F2B)' : 'none',
        transition: 'filter 200ms',
      }}
      title={drinkName}
    >
      {heldSrc ? (
        <img
          src={heldSrc}
          alt=""
          className={isToasting ? 'patron-toast' : isDrinking ? 'patron-sip' : undefined}
          style={{
            height: PATRON_HEIGHT,
            width: 'auto',
            display: 'block',
            // Rocked back on their heels while the shove carries them.
            transform: isLeaving ? 'rotate(4deg)' : undefined,
            transformOrigin: '50% 100%',
          }}
        />
      ) : isWatching ? (
        <img
          src={patronPortrait(patronType, drinkType)}
          alt=""
          className="patron-watch"
          style={{ height: PATRON_HEIGHT, width: 'auto', display: 'block' }}
        />
      ) : walkSheet ? (
        <div
          className="patron-walk-cycle-sprite"
          style={{
            height: PATRON_HEIGHT,
            width: PATRON_HEIGHT * walkSheet.aspectRatio,
            backgroundImage: `url(${walkSheet.src})`,
            // Safe alongside the sprite animation — that only animates
            // background-position-x, so it doesn't own this.
            animationDuration: `${Math.round(
              walkCycleMs(walkSheet, laneWidthPx, speed)
            )}ms`,
            animationPlayState: still ? 'paused' : 'running',
          }}
        />
      ) : (
        <div className="patron-walk">
          <img
            src={patronPortrait(patronType, drinkType)}
            alt=""
            style={{
              height: PATRON_HEIGHT,
              width: 'auto',
              display: 'block',
            }}
          />
        </div>
      )}
    </div>
  )
}
