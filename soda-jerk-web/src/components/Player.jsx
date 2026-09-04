import { SeltzerSprayGlyph } from './sprites.jsx'
import { COUNTER_HEIGHT_PX } from '../game/constants.js'

const STAND_SRC = `${import.meta.env.BASE_URL}art/player-stand.png`
const RUN_SRC = `${import.meta.env.BASE_URL}art/player-run.png`

export default function Player({ x, spraying, moveDir }) {
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
          <div
            className="absolute seltzer-spray"
            style={{ left: '55%', top: '18%', transform: 'translate(-35%, -50%)' }}
          >
            <SeltzerSprayGlyph />
          </div>
        )}
      </div>
    </div>
  )
}
