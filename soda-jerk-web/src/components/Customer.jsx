import { PLAYER_X, COUNTER_HEIGHT_PX, STEP_EASE } from '../game/constants.js'
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
// prints it. It's what times the legs — see strideOf().
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

// Body movement while walking: a lean into the bar at full stride, and a
// rock from foot to foot with each step. Both scale with how fast they're
// actually going, so they ease off to upright as a step slows to a stop.
const LEAN_DEG = 3
const ROCK_DEG = 1.6

// The legs are driven by the ground covered, not by a clock: one cycle per
// `ground` of distance (in px, at PATRON_HEIGHT). The planted foot then
// stays put on the floor however the pace changes through a step — speed
// up and the legs speed up with it, slow to a stop and they settle with
// it, instead of a timer walking them on the spot or sliding the feet.
function strideOf(sheet, walked, laneWidthPx) {
  if (!laneWidthPx) return 0
  const walkedPx = (walked / 100) * laneWidthPx
  const cycles = walkedPx / (sheet.ground * PATRON_HEIGHT)
  return cycles - Math.floor(cycles) // 0..1 through the cycle
}

// `walked`, `vel`: distance walked so far and current pace (lane %, %/s),
// from the engine — see strideOf.
// `clamoring`: standing between steps, rocking toward the bar for a drink.
export default function Customer({ x, drinkType, patronType, status, drinkName, speed, vel, walked, laneWidthPx, clamoring, pauseTotalMs }) {
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
  const stride = walkSheet ? strideOf(walkSheet, walked, laneWidthPx) : 0
  const frame = Math.floor(stride * 8) % 8
  // 0 standing, 1 at the top speed of a step
  const pace = speed ? Math.min(1, (vel || 0) / (speed / (1 - STEP_EASE))) : 0
  const tilt = -LEAN_DEG * pace + ROCK_DEG * Math.sin(stride * 4 * Math.PI) * pace

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
          className={clamoring ? 'patron-clamor' : undefined}
          // one rock per pause, so it's upright again as the next step starts
          style={clamoring && pauseTotalMs ? { animationDuration: `${Math.round(pauseTotalMs)}ms` } : undefined}
        >
          <div
            className="patron-walk-cycle-sprite"
            style={{
              height: PATRON_HEIGHT,
              width: PATRON_HEIGHT * walkSheet.aspectRatio,
              backgroundImage: `url(${walkSheet.src})`,
              // the frame comes from the distance walked (see strideOf),
              // not from the sheet's own timed animation
              animation: 'none',
              backgroundPositionX: `${(frame / 7) * 100}%`,
              transform: `rotate(${tilt.toFixed(2)}deg)`,
              transformOrigin: '50% 100%',
            }}
          />
        </div>
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
