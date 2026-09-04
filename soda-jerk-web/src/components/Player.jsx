import { PlayerSprite, SeltzerSprayGlyph } from './sprites.jsx'
import { COUNTER_HEIGHT_PX } from '../game/constants.js'

export default function Player({ x, spraying }) {
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
        <PlayerSprite />
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
