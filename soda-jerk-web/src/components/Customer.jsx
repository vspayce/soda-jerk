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
// build.py, add a row here with the canvas size and stride it prints, and
// add a weight to PATRON_TYPE_WEIGHTS in constants.js.
//
// Every figure is drawn 267px tall on a 279px canvas, so one height puts
// the whole roster at the same scale.
const PATRON_HEIGHT = 89

// Each entry's aspectRatio (canvas width / height) keeps the sprite from
// stretching at PATRON_HEIGHT.
//
// `stride` is how far a foot travels across the cycle, as a fraction of
// the frame's width — i.e. how much ground one step covers. build.py
// measures it off the rig. It matters because it sets how fast the legs
// have to cycle to keep the planted foot still on the ground — see
// walkCycleMs(). The mom and the clown are low because only the mom's
// calves show under her dress and the clown's baggy legs barely part:
// they take quick short steps.
const sheets = (patronType, width, stride) => [
  { src: patronWalkSheet(patronType, 0), aspectRatio: width / 279, stride },
  { src: patronWalkSheet(patronType, 1), aspectRatio: width / 279, stride },
]
const PATRON_WALK_SHEETS = {
  0: sheets(0, 191, 0.368),
  1: sheets(1, 294, 0.126),
  2: sheets(2, 201, 0.333),
  3: sheets(3, 202, 0.304),
  4: sheets(4, 196, 0.374),
  5: sheets(5, 171, 0.466),
  6: sheets(6, 187, 0.386),
  7: sheets(7, 200, 0.3),
  8: sheets(8, 227, 0.14),
  9: sheets(9, 206, 0.411),
  10: sheets(10, 192, 0.181),
  11: sheets(11, 158, 0.304),
}

// The legs have to cycle at whatever rate keeps the planted foot from
// sliding along the floor. That rate isn't a constant: the game walks
// patrons ~2.3x faster at the top level than the first (see
// customerTravelMs in levels.js), and a served patron walks out faster
// still, while the sheets themselves differ ~2x in how much ground one
// step covers. A fixed duration therefore only ever matched one
// combination, and everything else moonwalked — worst on the
// short-stride sheets, which is why the two original hand-supplied
// patrons (the longest strides in the set) looked fine while the
// generated ones didn't.
//
// The reference point is patron-orange at the level-1 walk-in speed,
// which is the combination that already read correctly; everything else
// is scaled off it, so this is a pure ratio and needs no lane-width or
// pixel conversion.
const REF_CYCLE_MS = 900
const REF_STRIDE = 0.372
const REF_WIDTH = 89 * (137 / 256)
const REF_SPEED = (108 - 16) / (14702 / 1000) // lane-% per second, level 1

function walkCycleMs(sheet, widthPx, speed) {
  if (!speed) return REF_CYCLE_MS
  const groundPerCycle = (sheet.stride * widthPx) / (REF_STRIDE * REF_WIDTH)
  const ms = REF_CYCLE_MS * groundPerCycle * (REF_SPEED / Math.abs(speed))
  // Keep it inside a believable gait even if a level speed goes to an
  // extreme. The floor is roughly eight frames at 60fps — below that the
  // browser drops frames anyway, so a lower number buys nothing and only
  // lets the feet slip.
  return Math.max(140, Math.min(1500, ms))
}

export default function Customer({ x, drinkType, patronType, status, drinkName, speed }) {
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
              walkCycleMs(walkSheet, PATRON_HEIGHT * walkSheet.aspectRatio, speed)
            )}ms`,
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
