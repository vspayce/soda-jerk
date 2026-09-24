import Customer from './Customer.jsx'
import Player from './Player.jsx'
import { MugGlyph } from './sprites.jsx'
import { PLAYER_X } from '../game/constants.js'

export default function Lane({ customers, mugs, glasses, isPlayerLane }) {
  return (
    <div className="relative flex-1 min-h-0">
      {/* bar rail — brass chevron trim over a dark wood body */}
      <div
        className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-3 rounded-full overflow-hidden"
        style={{
          background: 'repeating-linear-gradient(135deg, #C6A15B 0 5px, #8A6E37 5px 10px)',
          boxShadow: '0 2px 5px rgba(0,0,0,0.55)',
          border: '1px solid #151014',
        }}
      />
      {/* dark surface under the rail so the lane reads as a distinct row */}
      <div className="absolute left-0 right-0 top-1/2 h-9 -translate-y-1/2 opacity-25 bg-black rounded-sm" />

      {isPlayerLane && <Player x={PLAYER_X} />}

      {customers.map((c) => (
        <Customer key={c.id} id={c.id} x={c.x} color={c.color} status={c.status} drinkName={c.drinkName} />
      ))}

      {mugs.map((m) => (
        <div
          key={m.id}
          className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${m.x}%`, top: '50%' }}
        >
          <MugGlyph />
        </div>
      ))}

      {glasses.map((g) => (
        <div
          key={g.id}
          className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${g.x}%`, top: '50%' }}
        >
          <MugGlyph empty />
        </div>
      ))}
    </div>
  )
}
