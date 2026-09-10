import { PLAYER_X, COUNTER_HEIGHT_PX } from '../game/constants.js'

// Glows red once a still-walking customer gets close to the end of
// the bar, as a warning — replaces the old patience-timer bar since
// customers no longer stop and wait; they just keep coming.
const DANGER_X = PLAYER_X + 22

// Patron illustrations, one row per patronType (picked at spawn — see
// PATRON_TYPE_WEIGHTS in constants.js) and one column per drink type.
// They face left (the direction they walk in), so served customers get
// flipped to face right as they head back out.
//
// To add another patron type: drop in `patronN-orange.png` /
// `patronN-pink.png`, add a row here (and a height below), plus a walk
// sheet, and add a weight to PATRON_TYPE_WEIGHTS in constants.js.
const PATRON_SRC = [
  [`${import.meta.env.BASE_URL}art/patron-orange.png`, `${import.meta.env.BASE_URL}art/patron-pink.png`],
  [`${import.meta.env.BASE_URL}art/patron2-orange.png`, `${import.meta.env.BASE_URL}art/patron2-pink.png`],
  [`${import.meta.env.BASE_URL}art/patron3-orange.png`, `${import.meta.env.BASE_URL}art/patron3-pink.png`],
  [`${import.meta.env.BASE_URL}art/patron4-orange.png`, `${import.meta.env.BASE_URL}art/patron4-pink.png`],
  [`${import.meta.env.BASE_URL}art/patron5-orange.png`, `${import.meta.env.BASE_URL}art/patron5-pink.png`],
  [`${import.meta.env.BASE_URL}art/patron6-orange.png`, `${import.meta.env.BASE_URL}art/patron6-pink.png`],
  [`${import.meta.env.BASE_URL}art/patron7-orange.png`, `${import.meta.env.BASE_URL}art/patron7-pink.png`],
  [`${import.meta.env.BASE_URL}art/patron8-orange.png`, `${import.meta.env.BASE_URL}art/patron8-pink.png`],
]
// Some illustrations (e.g. the mom-and-son pair) are wider than others,
// so each patronType gets its own height to read at a consistent scale.
// 25% bigger across the board, then another 10% on top of that — small
// enough to miss details like the caricature patrons otherwise.
const PATRON_HEIGHT = [89, 91, 89, 89, 89, 89, 89, 89]

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
    { src: `${import.meta.env.BASE_URL}art/patron-orange-walk.png`, aspectRatio: 137 / 256, stride: 0.372 },
    { src: `${import.meta.env.BASE_URL}art/patron-pink-walk.png`, aspectRatio: 131 / 256, stride: 0.393 },
  ],
  1: [
    { src: `${import.meta.env.BASE_URL}art/patron2-orange-walk.png`, aspectRatio: 235 / 256, stride: 0.270 },
    { src: `${import.meta.env.BASE_URL}art/patron2-pink-walk.png`, aspectRatio: 238 / 256, stride: 0.201 },
  ],
  2: [
    { src: `${import.meta.env.BASE_URL}art/patron3-orange-walk.png`, aspectRatio: 147 / 256, stride: 0.379 },
    { src: `${import.meta.env.BASE_URL}art/patron3-pink-walk.png`, aspectRatio: 144 / 256, stride: 0.379 },
  ],
  3: [
    { src: `${import.meta.env.BASE_URL}art/patron4-orange-walk.png`, aspectRatio: 137 / 256, stride: 0.278 },
    { src: `${import.meta.env.BASE_URL}art/patron4-pink-walk.png`, aspectRatio: 137 / 256, stride: 0.339 },
  ],
  4: [
    { src: `${import.meta.env.BASE_URL}art/patron5-orange-walk.png`, aspectRatio: 137 / 256, stride: 0.281 },
    { src: `${import.meta.env.BASE_URL}art/patron5-pink-walk.png`, aspectRatio: 137 / 256, stride: 0.355 },
  ],
  5: [
    { src: `${import.meta.env.BASE_URL}art/patron6-orange-walk.png`, aspectRatio: 138 / 256, stride: 0.354 },
    { src: `${import.meta.env.BASE_URL}art/patron6-pink-walk.png`, aspectRatio: 138 / 256, stride: 0.339 },
  ],
  6: [
    { src: `${import.meta.env.BASE_URL}art/patron7-orange-walk.png`, aspectRatio: 138 / 256, stride: 0.345 },
    { src: `${import.meta.env.BASE_URL}art/patron7-pink-walk.png`, aspectRatio: 138 / 256, stride: 0.227 },
  ],
  7: [
    { src: `${import.meta.env.BASE_URL}art/patron8-orange-walk.png`, aspectRatio: 138 / 256, stride: 0.269 },
    { src: `${import.meta.env.BASE_URL}art/patron8-pink-walk.png`, aspectRatio: 138 / 256, stride: 0.371 },
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
  // Keep it inside a believable gait even if a level or exit speed goes
  // to an extreme.
  return Math.max(260, Math.min(1500, ms))
}

export default function Customer({ x, drinkType, patronType, status, drinkName, speed }) {
  const isUrgent = status === 'walking' && x <= DANGER_X
  // A served customer walks back out too, so they keep the walk cycle —
  // just mirrored, since they're now heading the other way. Leaving them
  // on the static portrait (as this used to) slid a frozen, mid-stride
  // sprite across the counter with motionless legs, which reads as
  // moonwalking backwards rather than walking out.
  const isLeaving = status === 'leaving-happy'
  const walkSheet =
    status === 'walking' || isLeaving ? PATRON_WALK_SHEETS[patronType]?.[drinkType] : null

  return (
    <div
      className="absolute z-10 customer-emerge"
      style={{
        left: `${x}%`,
        top: `calc(50% + ${COUNTER_HEIGHT_PX / 2}px)`,
        transform: 'translate(-50%, -100%)',
        // A served customer walks out the same way an unserved one walks
        // in — from the same side, toward the same door — so without a
        // clear "already served" cue the player can't tell them apart and
        // throws a drink at someone who can't take it (a mug only ever
        // targets a customer whose status is still 'walking', so it sails
        // straight through and is wasted). Ghosting them well back, plus
        // desaturating, makes it unmistakable at a glance. 0.75 opacity
        // alone was far too subtle against this dark bar.
        filter: isUrgent
          ? 'drop-shadow(0 0 5px #7A1F2B)'
          : isLeaving
            ? 'grayscale(0.55)'
            : 'none',
        opacity: isLeaving ? 0.4 : 1,
        transition: 'opacity 200ms, filter 200ms',
      }}
      title={drinkName}
    >
      {walkSheet ? (
        <div
          className="patron-walk-cycle-sprite"
          style={{
            height: PATRON_HEIGHT[patronType],
            width: PATRON_HEIGHT[patronType] * walkSheet.aspectRatio,
            backgroundImage: `url(${walkSheet.src})`,
            // Both safe to set alongside the sprite animation — it only
            // animates background-position-x, so it owns neither of these.
            transform: isLeaving ? 'scaleX(-1)' : 'none',
            animationDuration: `${Math.round(
              walkCycleMs(walkSheet, PATRON_HEIGHT[patronType] * walkSheet.aspectRatio, speed)
            )}ms`,
          }}
        />
      ) : (
        <div className="patron-walk">
          <img
            src={PATRON_SRC[patronType][drinkType]}
            alt=""
            style={{
              height: PATRON_HEIGHT[patronType],
              width: 'auto',
              display: 'block',
              transform: status === 'leaving-happy' ? 'scaleX(-1)' : 'none',
            }}
          />
        </div>
      )}
    </div>
  )
}
