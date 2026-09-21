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
// To add another patron type: drop in `patronN-orange.png` /
// `patronN-pink.png`, add a row here (and a height below), plus a walk
// sheet, and add a weight to PATRON_TYPE_WEIGHTS in constants.js.
// Some illustrations (e.g. the mom-and-son pair) are wider than others,
// so each patronType gets its own height to read at a consistent scale.
// 25% bigger across the board, then another 10% on top of that — small
// enough to miss details like the caricature patrons otherwise.
const PATRON_HEIGHT = [89, 91, 89, 89, 89, 89, 89, 89]

// The moment-of-catch pose: the same portrait art with the drink they
// actually ordered placed in their outstretched hand, so the reward for a
// correct serve is legible. The glass is the very same art the player taps
// on the tap handle, composited in — not a redrawn one — so the colour
// reads identically to the drink they chose. Padded symmetrically around
// the body, so swapping this in doesn't jog the patron sideways.

// Real 8-frame walk-cycle sprite sheets (PixelLab-generated from each static
// illustration), used while a patron is actively walking in. Each entry's
// aspectRatio (native frame width / height) keeps the sprite from stretching
// at PATRON_HEIGHT.
//
// `stride` is how far the leading foot travels across the cycle, as a
// fraction of the frame's width — i.e. how much ground one step covers.
// It's measured off the art itself and varies almost 2x between sheets
// (0.20 to 0.39), because each was animated separately. It matters
// because it sets how fast the legs have to cycle to keep the planted
// foot still on the ground — see walkCycleMs().
const PATRON_WALK_SHEETS = {
  0: [
    { src: patronWalkSheet(0, 0), aspectRatio: 137 / 256, stride: 0.372 },
    { src: patronWalkSheet(0, 1), aspectRatio: 131 / 256, stride: 0.393 },
  ],
  1: [
    { src: patronWalkSheet(1, 0), aspectRatio: 235 / 256, stride: 0.270 },
    { src: patronWalkSheet(1, 1), aspectRatio: 238 / 256, stride: 0.201 },
  ],
  2: [
    { src: patronWalkSheet(2, 0), aspectRatio: 147 / 256, stride: 0.379 },
    { src: patronWalkSheet(2, 1), aspectRatio: 144 / 256, stride: 0.379 },
  ],
  3: [
    { src: patronWalkSheet(3, 0), aspectRatio: 137 / 256, stride: 0.278 },
    { src: patronWalkSheet(3, 1), aspectRatio: 137 / 256, stride: 0.339 },
  ],
  4: [
    { src: patronWalkSheet(4, 0), aspectRatio: 136 / 256, stride: 0.167 },
    { src: patronWalkSheet(4, 1), aspectRatio: 136 / 256, stride: 0.499 },
  ],
  5: [
    { src: patronWalkSheet(5, 0), aspectRatio: 138 / 256, stride: 0.354 },
    { src: patronWalkSheet(5, 1), aspectRatio: 138 / 256, stride: 0.339 },
  ],
  6: [
    { src: patronWalkSheet(6, 0), aspectRatio: 138 / 256, stride: 0.345 },
    { src: patronWalkSheet(6, 1), aspectRatio: 138 / 256, stride: 0.227 },
  ],
  7: [
    { src: patronWalkSheet(7, 0), aspectRatio: 138 / 256, stride: 0.269 },
    { src: patronWalkSheet(7, 1), aspectRatio: 138 / 256, stride: 0.371 },
  ],
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
  // Caught the drink and now sliding back from it, Tapper-style. They keep
  // facing the bartender the whole way — they're being shoved, not walking
  // out — so there's no mirroring and no walk cycle, which is what every
  // version of the backwards-walking bug came from. A shove has no gait.
  const isLeaving = status === 'leaving-happy'
  const isToasting = status === 'toasting'
  // Both the impact beat and the slide show them holding what they caught.
  const heldSrc = isToasting || isLeaving ? patronHeld(patronType, drinkType) : null
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
          className={isToasting ? 'patron-toast' : undefined}
          style={{
            height: PATRON_HEIGHT[patronType],
            width: 'auto',
            display: 'block',
            // Rocked back on their heels while the shove carries them.
            transform: isLeaving ? 'rotate(4deg)' : undefined,
            transformOrigin: '50% 100%',
          }}
        />
      ) : walkSheet ? (
        <div
          className="patron-walk-cycle-sprite"
          style={{
            height: PATRON_HEIGHT[patronType],
            width: PATRON_HEIGHT[patronType] * walkSheet.aspectRatio,
            backgroundImage: `url(${walkSheet.src})`,
            // Safe alongside the sprite animation — that only animates
            // background-position-x, so it doesn't own this.
            animationDuration: `${Math.round(
              walkCycleMs(walkSheet, PATRON_HEIGHT[patronType] * walkSheet.aspectRatio, speed)
            )}ms`,
          }}
        />
      ) : (
        <div className="patron-walk">
          <img
            src={patronPortrait(patronType, drinkType)}
            alt=""
            style={{
              height: PATRON_HEIGHT[patronType],
              width: 'auto',
              display: 'block',
            }}
          />
        </div>
      )}
    </div>
  )
}
