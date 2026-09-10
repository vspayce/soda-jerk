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
const PATRON_WALK_SHEETS = {
  0: [
    { src: `${import.meta.env.BASE_URL}art/patron-orange-walk.png`, aspectRatio: 137 / 256 },
    { src: `${import.meta.env.BASE_URL}art/patron-pink-walk.png`, aspectRatio: 131 / 256 },
  ],
  1: [
    { src: `${import.meta.env.BASE_URL}art/patron2-orange-walk.png`, aspectRatio: 235 / 256 },
    { src: `${import.meta.env.BASE_URL}art/patron2-pink-walk.png`, aspectRatio: 238 / 256 },
  ],
  2: [
    { src: `${import.meta.env.BASE_URL}art/patron3-orange-walk.png`, aspectRatio: 147 / 256 },
    { src: `${import.meta.env.BASE_URL}art/patron3-pink-walk.png`, aspectRatio: 144 / 256 },
  ],
  3: [
    { src: `${import.meta.env.BASE_URL}art/patron4-orange-walk.png`, aspectRatio: 137 / 256 },
    { src: `${import.meta.env.BASE_URL}art/patron4-pink-walk.png`, aspectRatio: 137 / 256 },
  ],
  4: [
    { src: `${import.meta.env.BASE_URL}art/patron5-orange-walk.png`, aspectRatio: 137 / 256 },
    { src: `${import.meta.env.BASE_URL}art/patron5-pink-walk.png`, aspectRatio: 137 / 256 },
  ],
  5: [
    { src: `${import.meta.env.BASE_URL}art/patron6-orange-walk.png`, aspectRatio: 138 / 256 },
    { src: `${import.meta.env.BASE_URL}art/patron6-pink-walk.png`, aspectRatio: 138 / 256 },
  ],
  6: [
    { src: `${import.meta.env.BASE_URL}art/patron7-orange-walk.png`, aspectRatio: 138 / 256 },
    { src: `${import.meta.env.BASE_URL}art/patron7-pink-walk.png`, aspectRatio: 138 / 256 },
  ],
  7: [
    { src: `${import.meta.env.BASE_URL}art/patron8-orange-walk.png`, aspectRatio: 138 / 256 },
    { src: `${import.meta.env.BASE_URL}art/patron8-pink-walk.png`, aspectRatio: 138 / 256 },
  ],
}

export default function Customer({ x, drinkType, patronType, status, drinkName }) {
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
        filter: isUrgent ? 'drop-shadow(0 0 5px #7A1F2B)' : 'none',
        opacity: status === 'leaving-happy' ? 0.75 : 1,
        transition: 'opacity 200ms',
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
            // Safe to set alongside the sprite animation — that animates
            // background-position-x, not transform.
            transform: isLeaving ? 'scaleX(-1)' : 'none',
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
