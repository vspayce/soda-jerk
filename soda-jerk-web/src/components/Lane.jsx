import Customer from './Customer.jsx'
import Player from './Player.jsx'
import { PLAYER_X, COUNTER_HEIGHT_PX, DRINK_TYPES } from '../game/constants.js'

// Mugs, glasses, and the hot dog ride along the counter's top surface,
// not its vertical center — otherwise they read as embedded in the middle
// of the wood texture instead of resting on top of it. The bar-counter
// art's visible rail sits a bit above the image's geometric top edge, so
// this nudges up past that edge rather than sitting exactly on it.
const COUNTER_SURFACE_Y = `calc(50% - ${COUNTER_HEIGHT_PX / 2 + 10}px)`

const ART_SRC = (name) => `${import.meta.env.BASE_URL}art/${name}`
const DRINK_ICON_SRC = (icon) => ART_SRC(icon)
const BAR_COUNTER_SRC = ART_SRC('bar-counter.png')
const SALOON_DOOR_SRC = ART_SRC('saloon-door.png')
const GLASS_EMPTY_SRC = ART_SRC('glass-empty.png')
const HOTDOG_SRC = ART_SRC('hotdog.png')
const FOUNTAIN_SRC = ART_SRC('fountain.png')

// Where the door and fountain sit, anchored the same way characters are —
// feet (or base) at the counter's bottom edge, extending upward from
// there. The fountain sits right behind the bartender's home spot.
const FIXTURE_Y = `calc(50% + ${COUNTER_HEIGHT_PX / 2}px)`
const DOOR_X = 95
const FOUNTAIN_X = PLAYER_X - 3

export default function Lane({
  customers,
  mugs,
  glasses,
  bonus,
  isPlayerLane,
  playerX,
  moveDir,
  spraying,
  sprayDrinkType,
  onGrabBonus,
}) {
  return (
    <div className="relative flex-1 min-h-0">
      {/* aisle floor beneath the counter, so the lane reads as a distinct row */}
      <div className="absolute left-0 right-0 top-1/2 h-9 -translate-y-1/2 opacity-25 bg-black rounded-sm" />

      {/* bar counter — spans the full lane so patrons are always walking
          along the bar itself */}
      <img
        src={BAR_COUNTER_SRC}
        alt=""
        className="absolute left-0 right-0 top-1/2 -translate-y-1/2"
        style={{ width: '100%', height: COUNTER_HEIGHT_PX, objectFit: 'cover', boxShadow: '0 3px 6px rgba(0,0,0,0.6)' }}
      />

      {/* saloon door — where customers enter from */}
      <img
        src={SALOON_DOOR_SRC}
        alt=""
        className="absolute z-0"
        style={{ left: `${DOOR_X}%`, top: FIXTURE_Y, height: 55, width: 'auto', transform: 'translate(-50%, -100%)' }}
      />

      {/* the fountain machine, behind the bartender at the start of the bar */}
      <img
        src={FOUNTAIN_SRC}
        alt=""
        className="absolute z-0"
        style={{ left: `${FOUNTAIN_X}%`, top: FIXTURE_Y, height: 60, width: 'auto', transform: 'translate(-50%, -100%)' }}
      />

      {isPlayerLane && (
        <Player x={playerX} spraying={spraying} sprayDrinkType={sprayDrinkType} moveDir={moveDir} />
      )}

      {customers.map((c) => (
        <Customer key={c.id} id={c.id} x={c.x} drinkType={c.drinkType} status={c.status} drinkName={c.drinkName} />
      ))}

      {mugs.map((m) => (
        <div
          key={m.id}
          className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${m.x}%`, top: COUNTER_SURFACE_Y }}
        >
          <img
            src={DRINK_ICON_SRC(DRINK_TYPES[m.drinkType].icon)}
            alt=""
            style={{ height: 39, width: 'auto', display: 'block' }}
          />
        </div>
      ))}

      {glasses.map((g) => (
        <div
          key={g.id}
          className="absolute z-20 -translate-x-1/2 -translate-y-1/2 glass-return"
          style={{ left: `${g.x}%`, top: COUNTER_SURFACE_Y }}
        >
          <img src={GLASS_EMPTY_SRC} alt="" style={{ height: 44, width: 'auto', display: 'block' }} />
        </div>
      ))}

      {bonus && (
        <div
          className="absolute z-20 -translate-x-1/2 -translate-y-1/2 glass-return flex items-center justify-center"
          style={{ left: `${bonus.x}%`, top: COUNTER_SURFACE_Y, padding: 14 }}
          onPointerDown={(e) => {
            e.preventDefault()
            onGrabBonus()
          }}
        >
          <img src={HOTDOG_SRC} alt="" style={{ height: 13, width: 'auto', display: 'block' }} />
        </div>
      )}
    </div>
  )
}
