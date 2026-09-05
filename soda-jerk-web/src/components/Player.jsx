import { COUNTER_HEIGHT_PX } from '../game/constants.js'

const STAND_SRC = `${import.meta.env.BASE_URL}art/player-stand.png`
const RUN_SRC = `${import.meta.env.BASE_URL}art/player-run.png`

// The patron who reached the end of the bar sprays the bartender — shown
// in their own drink color, leaning in from the right (they face left,
// toward the bartender, already the right way round for this).
const SPRAY_SRC = [`${import.meta.env.BASE_URL}art/spray-orange.png`, `${import.meta.env.BASE_URL}art/spray-pink.png`]

export default function Player({ x, spraying, sprayDrinkType, moveDir }) {
  const running = moveDir !== 0

  return (
    <div
      className="absolute z-20"
      style={{
        left: `${x}%`,
        top: `calc(50% + ${COUNTER_HEIGHT_PX / 2}px)`,
        transform: 'translate(-50%, -100%)',
      }}
    >
      <div className={`relative ${spraying ? 'player-flinch' : ''}`}>
        <img
          src={running ? RUN_SRC : STAND_SRC}
          alt=""
          style={{
            height: 52,
            width: 'auto',
            display: 'block',
            transform: moveDir === -1 ? 'scaleX(-1)' : 'none',
          }}
        />
        {spraying && (
          <img
            src={SPRAY_SRC[sprayDrinkType]}
            alt=""
            className="absolute seltzer-spray"
            style={{ left: '100%', bottom: 0, marginLeft: 4, height: 54, width: 'auto' }}
          />
        )}
      </div>
    </div>
  )
}
