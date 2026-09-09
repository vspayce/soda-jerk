import { useState } from 'react'
import {
  PLATES_LANE_PATHS,
  PLATES_START_SCALE,
  PLATES_END_SCALE,
  PLATES_BASE_SIZE_PCT,
  PLATES_DIRTY_POINTS,
  PLATES_DOLLAR_POINTS,
} from '../game/constants.js'

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
  // Floating "+25"/"+100" popups, purely decorative — the engine already
  // removed the plate and scored it by the time this fires, this is just
  // feedback layered on top, same spirit as the hot dog's Celebration.
  const [pops, setPops] = useState([])

  const handleClick = (plate) => {
    if (plate.kind !== 'clean') {
      const { x, y } = plateLayout(plate)
      const id = `${plate.id}-${Date.now()}`
      const text = plate.kind === 'dollar' ? `+${PLATES_DOLLAR_POINTS}` : `+${PLATES_DIRTY_POINTS}`
      setPops((prev) => [...prev, { id, x, y, text }])
      setTimeout(() => setPops((prev) => prev.filter((p) => p.id !== id)), 800)
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
      </div>

      {/* the soda jerk, seen from behind, spray bottle raised — the
          player's own point of view in this round */}
      <img
        src={JERK_BACK_SRC}
        alt=""
        className="absolute pointer-events-none"
        style={{ left: '50%', bottom: 0, transform: 'translateX(-50%)', height: '34vh', width: 'auto', zIndex: 900 }}
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
