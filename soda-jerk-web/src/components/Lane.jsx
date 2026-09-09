import { useEffect, useRef, useState } from 'react'
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
// From stage 2 on, the bar gets a permanent soda-fountain-diner reskin —
// see also PerspectiveBackdrop's `stage` prop for the matching wall/light
// palette swap.
const BAR_COUNTER_FOUNTAIN_SRC = ART_SRC('bar-counter-fountain.png')
const SALOON_DOOR_LEFT_SRC = ART_SRC('saloon-door-left.png')
const SALOON_DOOR_RIGHT_SRC = ART_SRC('saloon-door-right.png')
const DOOR_HEIGHT = 55
// Each leaf image is roughly half the full door's native width — matches
// the split made from saloon-door.png (410x898 / 411x898 at source res).
const DOOR_LEAF_WIDTH = (DOOR_HEIGHT * 410) / 898
const DOOR_SWING_MS = 700
const GLASS_EMPTY_SRC = ART_SRC('glass-empty.png')
const HOTDOG_SRC = ART_SRC('hotdog.png')
// One fountain design per lane, purely cosmetic variety — falls back to
// the original if a lane index somehow has none (there are exactly
// LANE_COUNT of these today, so this only matters if that ever changes).
// The three new ones sit a little further left and a little larger than
// the original — they're bulkier illustrations that read better with room.
const FOUNTAIN_X = PLAYER_X - 3
const FOUNTAIN_HEIGHT = 72
const NEW_FOUNTAIN_HEIGHT = FOUNTAIN_HEIGHT * 1.3
const FOUNTAIN_BY_LANE = [
  { src: ART_SRC('fountain.png'), x: FOUNTAIN_X, height: FOUNTAIN_HEIGHT },
  { src: ART_SRC('fountain2.png'), x: FOUNTAIN_X - 3, height: NEW_FOUNTAIN_HEIGHT },
  { src: ART_SRC('fountain3.png'), x: FOUNTAIN_X - 3, height: NEW_FOUNTAIN_HEIGHT },
  { src: ART_SRC('fountain4.png'), x: FOUNTAIN_X - 3, height: NEW_FOUNTAIN_HEIGHT },
]

// Where the door and fountain sit, anchored the same way characters are —
// feet (or base) at the counter's bottom edge, extending upward from
// there. The fountain sits right behind the bartender's home spot.
const FIXTURE_Y = `calc(50% + ${COUNTER_HEIGHT_PX / 2}px)`
const DOOR_X = 95

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
  sprayPatronType,
  throwing,
  laneIndex,
  stage,
  onGrabBonus,
  onGrabGlass,
}) {
  // Patrons actually spawn well off-screen (see OFFSCREEN_X) and would
  // otherwise just pop into view at the screen edge, unrelated to the door.
  // To read as walking OUT of the saloon instead, an incoming ("walking")
  // customer stays unrendered until they reach the door's x position, then
  // appears right there as the door swings open — a served ("leaving-happy")
  // customer heading back out is left alone, still visible the whole way.
  const visibleCustomers = customers.filter((c) => c.status !== 'walking' || c.x <= DOOR_X)
  const enteringCount = customers.filter((c) => c.status === 'walking' && c.x <= DOOR_X).length

  const prevEnteringCountRef = useRef(enteringCount)
  const [doorSwinging, setDoorSwinging] = useState(false)
  useEffect(() => {
    if (enteringCount > prevEnteringCountRef.current) {
      setDoorSwinging(true)
      const t = setTimeout(() => setDoorSwinging(false), DOOR_SWING_MS)
      prevEnteringCountRef.current = enteringCount
      return () => clearTimeout(t)
    }
    prevEnteringCountRef.current = enteringCount
  }, [enteringCount])

  return (
    <div className="relative flex-1 min-h-0" data-lane-index={laneIndex}>
      {/* aisle floor beneath the counter, so the lane reads as a distinct row */}
      <div className="absolute left-0 right-0 top-1/2 h-9 -translate-y-1/2 opacity-25 bg-black rounded-sm" />

      {/* bar counter — spans the full lane so patrons are always walking
          along the bar itself */}
      <img
        src={stage >= 2 ? BAR_COUNTER_FOUNTAIN_SRC : BAR_COUNTER_SRC}
        alt=""
        className="absolute left-0 right-0 top-1/2 -translate-y-1/2"
        style={{ width: '100%', height: COUNTER_HEIGHT_PX, objectFit: 'cover', boxShadow: '0 3px 6px rgba(0,0,0,0.6)' }}
      />

      {/* saloon door — where customers enter from, split into its two
          swinging leaves so each can hinge from its own outer post */}
      <div
        className={`absolute z-0 ${doorSwinging ? 'saloon-door-swinging' : ''}`}
        style={{
          left: `${DOOR_X}%`,
          top: FIXTURE_Y,
          height: DOOR_HEIGHT,
          width: DOOR_LEAF_WIDTH * 2,
          transform: 'translate(-50%, -100%)',
          perspective: 220,
        }}
      >
        <img
          src={SALOON_DOOR_LEFT_SRC}
          alt=""
          className="saloon-door-leaf saloon-door-leaf-left absolute top-0 left-0"
          style={{ height: DOOR_HEIGHT, width: DOOR_LEAF_WIDTH, transformOrigin: 'left center' }}
        />
        <img
          src={SALOON_DOOR_RIGHT_SRC}
          alt=""
          className="saloon-door-leaf saloon-door-leaf-right absolute top-0 right-0"
          style={{ height: DOOR_HEIGHT, width: DOOR_LEAF_WIDTH, transformOrigin: 'right center' }}
        />
      </div>

      {/* the fountain machine, behind the bartender at the start of the bar */}
      <img
        src={FOUNTAIN_BY_LANE[laneIndex % FOUNTAIN_BY_LANE.length].src}
        alt=""
        className="absolute z-0"
        style={{
          left: `${FOUNTAIN_BY_LANE[laneIndex % FOUNTAIN_BY_LANE.length].x}%`,
          top: FIXTURE_Y,
          height: FOUNTAIN_BY_LANE[laneIndex % FOUNTAIN_BY_LANE.length].height,
          width: 'auto',
          transform: 'translate(-50%, -100%)',
        }}
      />

      {isPlayerLane && (
        <Player
          x={playerX}
          spraying={spraying}
          sprayDrinkType={sprayDrinkType}
          sprayPatronType={sprayPatronType}
          throwing={throwing}
          moveDir={moveDir}
        />
      )}

      {visibleCustomers.map((c) => (
        <Customer
          key={c.id}
          id={c.id}
          x={c.x}
          drinkType={c.drinkType}
          patronType={c.patronType}
          status={c.status}
          drinkName={c.drinkName}
        />
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
            style={{ height: 27, width: 'auto', display: 'block' }}
          />
        </div>
      ))}

      {glasses.map((g) => (
        // Same pattern as the hot dog — a stable, non-animated tap
        // target with padding for an easy hit, animation confined to
        // the inner image. Catchable any time, from anywhere.
        <div
          key={g.id}
          className="absolute z-20 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
          style={{ left: `${g.x}%`, top: COUNTER_SURFACE_Y, padding: 12, pointerEvents: g._missed ? 'none' : 'auto' }}
          onPointerDown={(e) => {
            e.preventDefault()
            onGrabGlass(g.id)
          }}
        >
          <img
            src={GLASS_EMPTY_SRC}
            alt=""
            className={`relative ${g._missed ? 'glass-falling' : 'glass-return'}`}
            style={{ height: 44, width: 'auto', display: 'block' }}
          />
          {/* two glints catching the light at different spots on the glass,
              twinkling out of sync so it reads as sparkle rather than a
              single pulsing highlight — only while it's still catchable */}
          {!g._missed && (
            <>
              <div className="glass-glint absolute" style={{ top: '28%', left: '32%' }} />
              <div className="glass-glint absolute" style={{ top: '62%', left: '64%', width: 6, height: 6, animationDelay: '0.4s' }} />
            </>
          )}
        </div>
      ))}

      {bonus && (
        // The tap target is this outer div — fixed geometry, never
        // animated, so it stays reliably hit-testable on touch. The
        // pulsing "notice me" animation lives entirely on the inner
        // child instead, purely visual.
        <div
          className="absolute z-20 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
          style={{ left: `${bonus.x}%`, top: COUNTER_SURFACE_Y, padding: 14 }}
          onPointerDown={(e) => {
            e.preventDefault()
            onGrabBonus()
          }}
        >
          <img src={HOTDOG_SRC} alt="" className="glass-return" style={{ height: 13, width: 'auto', display: 'block' }} />
        </div>
      )}
    </div>
  )
}
