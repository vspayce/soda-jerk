import { PLAYER_X, COUNTER_HEIGHT_PX } from '../game/constants.js'

// Glows red once a still-walking customer gets close to the end of
// the bar, as a warning — replaces the old patience-timer bar since
// customers no longer stop and wait; they just keep coming.
const DANGER_X = PLAYER_X + 22

// One patron illustration per drink type — they face left (the direction
// they walk in), so served customers get flipped to face right as they
// head back out.
const PATRON_SRC = [
  `${import.meta.env.BASE_URL}art/patron-orange.png`,
  `${import.meta.env.BASE_URL}art/patron-pink.png`,
]

export default function Customer({ x, drinkType, status, drinkName }) {
  const isUrgent = status === 'walking' && x <= DANGER_X

  return (
    <div
      className="absolute z-10"
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
      <img
        src={PATRON_SRC[drinkType]}
        alt=""
        style={{
          height: 50,
          width: 'auto',
          display: 'block',
          transform: status === 'leaving-happy' ? 'scaleX(-1)' : 'none',
        }}
      />
    </div>
  )
}
