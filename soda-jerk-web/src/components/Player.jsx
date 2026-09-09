import { COUNTER_HEIGHT_PX } from '../game/constants.js'

const STAND_SRC = `${import.meta.env.BASE_URL}art/player-stand.png`
const RUN_SRC = `${import.meta.env.BASE_URL}art/player-run.png`
const THROW_SRC = `${import.meta.env.BASE_URL}art/player-throw.png`

// The patron who reached the end of the bar sprays the bartender — shown
// in their own patron illustration and drink color, leaning in from the
// right (they face left, toward the bartender, already the right way
// round for this). One row per patronType, one column per drink type —
// same shape as Customer.jsx's PATRON_SRC.
const SPRAY_SRC = [
  [`${import.meta.env.BASE_URL}art/spray-orange.png`, `${import.meta.env.BASE_URL}art/spray-pink.png`],
  [`${import.meta.env.BASE_URL}art/spray-patron2-orange.png`, `${import.meta.env.BASE_URL}art/spray-patron2-pink.png`],
  [`${import.meta.env.BASE_URL}art/spray-patron3-orange.png`, `${import.meta.env.BASE_URL}art/spray-patron3-pink.png`],
]

export default function Player({ x, spraying, sprayDrinkType, sprayPatronType, throwing, moveDir }) {
  const running = moveDir !== 0
  const poseSrc = throwing ? THROW_SRC : running ? RUN_SRC : STAND_SRC

  return (
    <div
      className="absolute z-20"
      style={{
        left: `${x}%`,
        top: `calc(50% + ${COUNTER_HEIGHT_PX / 2}px)`,
        transform: 'translate(-50%, -100%)',
      }}
    >
      <div className={`relative ${spraying ? 'player-flinch' : ''} ${throwing ? 'player-throw-pop' : ''}`}>
        <img
          src={poseSrc}
          alt=""
          style={{
            height: 68,
            width: 'auto',
            display: 'block',
            transform: moveDir === -1 ? 'scaleX(-1)' : 'none',
          }}
        />
        {spraying && (
          <img
            src={SPRAY_SRC[sprayPatronType][sprayDrinkType]}
            alt=""
            className="absolute seltzer-spray"
            style={{ left: '100%', bottom: 0, marginLeft: 4, height: 70, width: 'auto' }}
          />
        )}
      </div>
    </div>
  )
}
