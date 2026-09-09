import { PLAYER_X, COUNTER_HEIGHT_PX } from '../game/constants.js'

// Glows red once a still-walking customer gets close to the end of
// the bar, as a warning — replaces the old patience-timer bar since
// customers no longer stop and wait; they just keep coming.
const DANGER_X = PLAYER_X + 22

// Patron illustrations, one row per patronType (picked at random at
// spawn — see PATRON_TYPE_COUNT in constants.js) and one column per drink
// type. They face left (the direction they walk in), so served customers
// get flipped to face right as they head back out.
//
// To add another patron type: drop in `patronN-orange.png` /
// `patronN-pink.png`, add a row here (and a height below), and bump
// PATRON_TYPE_COUNT in constants.js to match.
const PATRON_SRC = [
  [`${import.meta.env.BASE_URL}art/patron-orange.png`, `${import.meta.env.BASE_URL}art/patron-pink.png`],
  [`${import.meta.env.BASE_URL}art/patron2-orange.png`, `${import.meta.env.BASE_URL}art/patron2-pink.png`],
  [`${import.meta.env.BASE_URL}art/patron3-orange.png`, `${import.meta.env.BASE_URL}art/patron3-pink.png`],
]
// Some illustrations (e.g. the mom-and-son pair) are wider than others,
// so each patronType gets its own height to read at a consistent scale.
const PATRON_HEIGHT = [65, 66, 65]

// Real 6-frame walk-cycle sprite sheets (PixelLab-generated from each static
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
}

export default function Customer({ x, drinkType, patronType, status, drinkName }) {
  const isUrgent = status === 'walking' && x <= DANGER_X
  const walkSheet = status === 'walking' ? PATRON_WALK_SHEETS[patronType]?.[drinkType] : null

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
