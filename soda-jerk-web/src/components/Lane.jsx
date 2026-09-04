import Customer from './Customer.jsx'
import Player from './Player.jsx'
import { MugGlyph, DoorGlyph, TapGlyph, HotDogGlyph } from './sprites.jsx'
import { PLAYER_X, COUNTER_HEIGHT_PX } from '../game/constants.js'

// Mugs and glasses ride along the counter's top edge, not its vertical
// center, so they read as sliding on the surface rather than passing
// through the middle of the counter block.
const COUNTER_SURFACE_Y = `calc(50% - ${COUNTER_HEIGHT_PX / 2}px)`

// Where the door and tap sit, anchored the same way characters are — feet
// (or base) at the counter's bottom edge, extending upward from there.
const FIXTURE_Y = `calc(50% + ${COUNTER_HEIGHT_PX / 2}px)`
const DOOR_X = 95
const TAP_X = PLAYER_X + 5

export default function Lane({ customers, mugs, glasses, bonus, isPlayerLane, playerX, spraying }) {
  return (
    <div className="relative flex-1 min-h-0">
      {/* aisle floor beneath the counter, so the lane reads as a distinct row */}
      <div className="absolute left-0 right-0 top-1/2 h-9 -translate-y-1/2 opacity-25 bg-black rounded-sm" />

      {/* bar counter — brass-trimmed top over a wood front, spanning the
          full lane so patrons are always walking along the bar itself */}
      <div
        className="absolute left-0 right-0 top-1/2 -translate-y-1/2 rounded-md overflow-hidden flex flex-col"
        style={{
          height: COUNTER_HEIGHT_PX,
          boxShadow: '0 3px 6px rgba(0,0,0,0.6)',
          border: '1px solid #151014',
        }}
      >
        <div
          style={{
            height: 7,
            background: 'repeating-linear-gradient(135deg, #C6A15B 0 5px, #8A6E37 5px 10px)',
          }}
        />
        <div style={{ flex: 1, background: 'linear-gradient(180deg, #4A2F1C 0%, #2B1B10 100%)' }} />
      </div>

      {/* saloon door — where customers enter from */}
      <div
        className="absolute z-0"
        style={{ left: `${DOOR_X}%`, top: FIXTURE_Y, transform: 'translate(-50%, -100%)' }}
      >
        <DoorGlyph />
      </div>

      {/* soda tap — where mugs are filled from */}
      <div
        className="absolute z-10"
        style={{ left: `${TAP_X}%`, top: FIXTURE_Y, transform: 'translate(-50%, -100%)' }}
      >
        <TapGlyph />
      </div>

      {isPlayerLane && <Player x={playerX} spraying={spraying} />}

      {customers.map((c) => (
        <Customer key={c.id} id={c.id} x={c.x} color={c.color} status={c.status} drinkName={c.drinkName} />
      ))}

      {mugs.map((m) => (
        <div
          key={m.id}
          className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${m.x}%`, top: COUNTER_SURFACE_Y }}
        >
          <MugGlyph color={m.color} size={31} />
        </div>
      ))}

      {glasses.map((g) => (
        <div
          key={g.id}
          className="absolute z-20 -translate-x-1/2 -translate-y-1/2 glass-return"
          style={{ left: `${g.x}%`, top: COUNTER_SURFACE_Y }}
        >
          <MugGlyph empty size={34} />
        </div>
      ))}

      {bonus && (
        <div
          className="absolute z-20 -translate-x-1/2 -translate-y-1/2 glass-return"
          style={{ left: `${bonus.x}%`, top: COUNTER_SURFACE_Y }}
        >
          <HotDogGlyph />
        </div>
      )}
    </div>
  )
}
