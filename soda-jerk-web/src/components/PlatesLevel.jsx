import { useState } from 'react'
import {
  PLATES_LANE_PATHS,
  PLATES_START_SCALE,
  PLATES_END_SCALE,
  PLATES_BASE_SIZE_PCT,
  PLATES_DIRTY_POINTS,
  PLATES_DOLLAR_POINTS,
} from '../game/constants.js'

const SPRAY_DROPLET_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315]

// A quick burst of droplets + an expanding ring at the click point —
// stands in for a real spray-sprite animation (see PlatesLevel.jsx's
// top comment for why one isn't used).
function SprayBurst({ x, y }) {
  return (
    <div className="absolute pointer-events-none" style={{ left: `${x}%`, top: `${y}%`, zIndex: 1000 }}>
      <div
        className="spray-ring absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ width: 60, height: 60, border: '4px solid rgba(220,240,255,0.95)', boxShadow: '0 0 12px rgba(220,240,255,0.8)' }}
      />
      {SPRAY_DROPLET_ANGLES.map((angle) => (
        <div
          key={angle}
          className="spray-droplet absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ '--angle': `${angle}deg`, width: 12, height: 12, background: 'rgba(220,240,255,1)', boxShadow: '0 0 6px rgba(220,240,255,0.9)' }}
        />
      ))}
    </div>
  )
}

// Three conveyor belts, one per lane, each running from its own direction
// (see PLATES_LANE_PATHS) into the player. Drawn as an SVG overlay stretched
// exactly over the play area — viewBox 0-100 with preserveAspectRatio="none"
// so a lane's line endpoints land on the very same percentages plateLayout()
// positions its plates at — with an animated dashed tread standing in for
// belt motion. vector-effect keeps stroke/dash widths in real screen pixels
// despite the viewBox's non-uniform (aspect-distorting) stretch.
function ConveyorBelts() {
  return (
    <svg className="absolute inset-0 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ zIndex: 0 }}>
      {Object.entries(PLATES_LANE_PATHS).map(([lane, path]) => (
        <g key={lane}>
          <line
            x1={path.startX}
            y1={path.startY}
            x2={path.endX}
            y2={path.endY}
            stroke="#3A3D42"
            strokeWidth={5}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
          <line
            className="conveyor-belt-tread"
            x1={path.startX}
            y1={path.startY}
            x2={path.endX}
            y2={path.endY}
            stroke="#9AA2AA"
            strokeWidth={2}
            strokeLinecap="round"
            strokeDasharray="3 5"
            vectorEffect="non-scaling-stroke"
          />
        </g>
      ))}
    </svg>
  )
}

// A small dark "mouth" at each belt's start, where plates emerge from —
// with the same steam-puff flair the old shared dishwasher had.
function ConveyorMouths() {
  return (
    <>
      {Object.entries(PLATES_LANE_PATHS).map(([lane, path]) => (
        <div
          key={lane}
          className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{ left: `${path.startX}%`, top: `${path.startY}%`, zIndex: 0 }}
        >
          {[0, 1].map((i) => (
            <div
              key={i}
              className="dishwasher-steam absolute rounded-full"
              style={{
                left: -3 + i * 10,
                bottom: 6,
                width: 4,
                height: 11,
                background: 'rgba(255,255,255,0.6)',
                filter: 'blur(1.2px)',
                animationDelay: `${lane.length * 200 + i * 700}ms`,
              }}
            />
          ))}
          <div
            className="rounded-sm"
            style={{
              width: 26,
              height: 10,
              background: '#151014',
              border: '2px solid #3A3D42',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.8)',
            }}
          />
        </div>
      ))}
    </>
  )
}

// The plate-wash bonus round — a first-person shooting gallery. Plates
// approach from a shared vanishing point in 3 lanes (see
// PLATES_LANE_PATHS); a plate's on-screen position and size are both
// just linear interpolations of its 0-1 progress, so there's no physics
// tick needed here beyond what useGameEngine already advances.

const ART_SRC = (name) => `${import.meta.env.BASE_URL}art/${name}`
const JERK_BACK_SRC = ART_SRC('jerk-back.png')
const PLATE_SRC = {
  dirty: ART_SRC('dirty-plate.png'),
  clean: ART_SRC('clean-plate.png'),
  dollar: ART_SRC('dollar-plate.png'),
}

function plateLayout(plate) {
  const path = PLATES_LANE_PATHS[plate.lane]
  const t = Math.min(plate.progress, 1)
  const x = path.startX + (path.endX - path.startX) * t
  const y = path.startY + (path.endY - path.startY) * t
  const scale = PLATES_START_SCALE + (PLATES_END_SCALE - PLATES_START_SCALE) * t
  return { x, y, size: PLATES_BASE_SIZE_PCT * scale, z: Math.round(t * 1000) }
}

export default function PlatesLevel({ platesLevel, onPlateClick }) {
  // Floating "+25"/"+100" popups and spray bursts, purely decorative —
  // the engine already removed the plate and scored it by the time this
  // fires, this is just feedback layered on top, same spirit as the hot
  // dog's Celebration.
  const [pops, setPops] = useState([])
  const [bursts, setBursts] = useState([])
  // Bumped on every spray so the jerk's pump animation can be force-restarted
  // (via a React `key`) even when clicks land faster than the animation.
  const [pumpCount, setPumpCount] = useState(0)

  const handleClick = (plate) => {
    if (plate.kind !== 'clean') {
      const { x, y } = plateLayout(plate)
      const id = `${plate.id}-${Date.now()}`
      const text = plate.kind === 'dollar' ? `+${PLATES_DOLLAR_POINTS}` : `+${PLATES_DIRTY_POINTS}`
      setPops((prev) => [...prev, { id, x, y, text }])
      setTimeout(() => setPops((prev) => prev.filter((p) => p.id !== id)), 800)
      setBursts((prev) => [...prev, { id, x, y }])
      setTimeout(() => setBursts((prev) => prev.filter((b) => b.id !== id)), 400)
      setPumpCount((n) => n + 1)
    }
    onPlateClick(plate.id)
  }

  const secondsLeft = Math.max(0, Math.ceil(platesLevel.remainingMs / 1000))

  return (
    <div className="absolute inset-0 z-20 overflow-hidden bg-ink" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 78px)' }}>
      <div className="flex flex-col items-center">
        <div className="font-display text-brass text-lg tracking-[0.2em] mb-1">PLATE WASH</div>
        <div className="text-cream/60 text-[11px] tracking-[0.2em] mb-1">
          SPRAY THE DIRTY ONES — NEVER A CLEAN ONE
        </div>
        <div className="font-display text-cream/80 text-sm tracking-widest">{secondsLeft}s</div>
      </div>

      <div className="absolute inset-0">
        <ConveyorBelts />
        <ConveyorMouths />

        {platesLevel.plates.map((plate) => {
          const { x, y, size, z } = plateLayout(plate)
          return (
            <div
              key={plate.id}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${x}%`, top: `${y}%`, width: `${size}%`, zIndex: z, touchAction: 'none' }}
              onPointerDown={(e) => {
                e.preventDefault()
                handleClick(plate)
              }}
            >
              <img
                src={PLATE_SRC[plate.kind]}
                alt=""
                className="w-full h-auto"
                style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))' }}
              />
            </div>
          )
        })}

        {pops.map((pop) => (
          <div
            key={pop.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none celebrate-points font-display text-brass text-xl"
            style={{ left: `${pop.x}%`, top: `${pop.y}%`, zIndex: 1000, textShadow: '0 2px 6px rgba(0,0,0,0.8)' }}
          >
            {pop.text}
          </div>
        ))}

        {bursts.map((burst) => (
          <SprayBurst key={burst.id} x={burst.x} y={burst.y} />
        ))}
      </div>

      {/* the soda jerk, seen from behind, spray bottle raised — the
          player's own point of view in this round. Re-mounted (via `key`)
          on every spray so the pump animation restarts cleanly even when
          clicks land faster than the animation itself. */}
      <img
        key={pumpCount}
        src={JERK_BACK_SRC}
        alt=""
        className="absolute pointer-events-none jerk-spray-pump"
        style={{ left: '50%', bottom: 0, height: '34vh', width: 'auto', zIndex: 900 }}
      />

      {platesLevel.ended && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 1100 }}>
          <div
            className="font-display text-3xl tracking-wide px-6 py-2 text-center"
            style={{
              color: platesLevel.resultText === "TIME'S UP!" ? '#E8C878' : '#E0596B',
              textShadow: '0 3px 10px rgba(0,0,0,0.8)',
            }}
          >
            {platesLevel.resultText}
          </div>
        </div>
      )}
    </div>
  )
}
