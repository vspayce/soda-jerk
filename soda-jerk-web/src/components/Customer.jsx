import { CustomerSprite } from './sprites.jsx'
import { PLAYER_X, COUNTER_HEIGHT_PX } from '../game/constants.js'

// Glows red once a still-walking customer gets close to the end of
// the bar, as a warning — replaces the old patience-timer bar since
// customers no longer stop and wait; they just keep coming.
const DANGER_X = PLAYER_X + 22

export default function Customer({ x, color, status, drinkName, id }) {
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
      <CustomerSprite color={color} variantSeed={id} />
    </div>
  )
}
