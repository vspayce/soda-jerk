import { useRef } from 'react'
import {
  TEMPEST_SPOKES,
  TEMPEST_CENTER,
  TEMPEST_RADIUS_X,
  TEMPEST_RADIUS_Y,
  DRINK_TYPES,
} from '../game/constants.js'
import { ART_SRC, patronPortrait } from '../game/art.js'

const JERK_SRC = ART_SRC('player-stand.png')

// The frame is nowhere near square, so the web is an ellipse in percentage
// space with its own x and y radius — a single radius would come out as an
// oval squashed the wrong way. Angles start at the top and go clockwise so
// spoke 0 is straight up, which is what the rim positions read against.
const angleOf = (spoke) => (spoke / TEMPEST_SPOKES) * Math.PI * 2 - Math.PI / 2
const pointAt = (spoke, t) => {
  const a = angleOf(spoke)
  return {
    x: TEMPEST_CENTER.x + Math.cos(a) * TEMPEST_RADIUS_X * t,
    y: TEMPEST_CENTER.y + Math.sin(a) * TEMPEST_RADIUS_Y * t,
  }
}

export default function TempestLevel({ tempestLevel, onMoveTo }) {
  const s = tempestLevel
  const arenaRef = useRef(null)
  const draggingRef = useRef(false)

  // Drag anywhere and he follows your finger around the rim. Tapping a spot
  // sends him there too, since a tap is just a drag that didn't move.
  //
  // The web is an ellipse in percentage space, so the pointer offset has to
  // be normalised by each radius before taking the angle — measuring the
  // raw angle would bias every position toward the vertical and he'd never
  // line up with the spoke under your finger.
  const spokeUnderPointer = (e) => {
    const r = arenaRef.current.getBoundingClientRect()
    const x = ((e.clientX - r.left) / r.width) * 100
    const y = ((e.clientY - r.top) / r.height) * 100
    const nx = (x - TEMPEST_CENTER.x) / TEMPEST_RADIUS_X
    const ny = (y - TEMPEST_CENTER.y) / TEMPEST_RADIUS_Y
    if (Math.hypot(nx, ny) < 0.12) return null // dead zone at the hub
    const a = Math.atan2(ny, nx) + Math.PI / 2 // spoke 0 points straight up
    const spoke = (a / (Math.PI * 2)) * TEMPEST_SPOKES
    return ((Math.round(spoke) % TEMPEST_SPOKES) + TEMPEST_SPOKES) % TEMPEST_SPOKES
  }

  const onDown = (e) => {
    if (s.ended) return
    e.preventDefault()
    draggingRef.current = true
    arenaRef.current.setPointerCapture(e.pointerId)
    const spoke = spokeUnderPointer(e)
    if (spoke !== null) onMoveTo(spoke)
  }
  const onMove = (e) => {
    if (!draggingRef.current || s.ended) return
    const spoke = spokeUnderPointer(e)
    if (spoke !== null) onMoveTo(spoke)
  }
  const onUp = () => { draggingRef.current = false }
  const spokes = Array.from({ length: TEMPEST_SPOKES }, (_, i) => i)
  const jerk = pointAt(s.spoke, 1.12)

  return (
    <div
      ref={arenaRef}
      className="absolute inset-0 z-20 overflow-hidden bg-ink select-none"
      style={{ touchAction: 'none' }}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      <div
        className="absolute inset-x-0 flex flex-col items-center pointer-events-none"
        style={{ top: 'calc(env(safe-area-inset-top, 0px) + 74px)', zIndex: 40 }}
      >
        <div className="font-display text-brass text-lg tracking-[0.2em]">THE ROUNDS</div>
        <div className="text-cream/60 text-[11px] tracking-[0.2em] mt-1">
          DRAG AROUND THE RIM — KEEP THEM OFF IT
        </div>
        <div className="font-display text-cream/80 text-sm tracking-widest mt-1">
          {s.served} SERVED
        </div>
      </div>

      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* the rim he runs around */}
        <ellipse
          cx={TEMPEST_CENTER.x}
          cy={TEMPEST_CENTER.y}
          rx={TEMPEST_RADIUS_X}
          ry={TEMPEST_RADIUS_Y}
          fill="none"
          stroke="#3A2E23"
          strokeWidth={6}
          vectorEffect="non-scaling-stroke"
        />
        {spokes.map((i) => {
          const hub = pointAt(i, 0)
          const rim = pointAt(i, 1)
          const live = Math.round(s.spoke) % TEMPEST_SPOKES === i
          // Drawn as a tapered quad, not a stroked line: these are the
          // counters patrons climb, so they want the width and the wood of
          // a bar. Narrow at the hub and wide at the rim, which also reads
          // as them coming toward you.
          const nx = -(rim.y - hub.y), ny = rim.x - hub.x
          const len = Math.hypot(nx, ny) || 1
          const ux = nx / len, uy = ny / len
          const wHub = 0.9, wRim = 3.4
          const quad = (a, b) =>
            `${hub.x - ux * a},${hub.y - uy * a} ${hub.x + ux * a},${hub.y + uy * a} ` +
            `${rim.x + ux * b},${rim.y + uy * b} ${rim.x - ux * b},${rim.y - uy * b}`
          return (
            <g key={i}>
              <polygon points={quad(wHub, wRim)} fill={live ? '#8A6E44' : '#5A472F'} />
              <polygon points={quad(wHub * 0.4, wRim * 0.4)} fill={live ? '#C6A15B' : '#6B5334'} opacity={0.9} />
            </g>
          )
        })}
      </svg>

      {/* patrons climbing outward from the hub */}
      {s.patrons.map((p) => {
        const pt = pointAt(p.spoke, p.t)
        return (
          <img
            key={p.id}
            src={patronPortrait(p.patronType, p.drinkType)}
            alt=""
            className="absolute"
            style={{
              left: `${pt.x}%`,
              top: `${pt.y}%`,
              // Small at the hub and growing as they come at you, so the
              // web reads as depth rather than a flat diagram.
              height: `${5 + 7 * p.t}%`,
              width: 'auto',
              maxWidth: 'none',
              transform: 'translate(-50%, -70%)',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.6))',
              pointerEvents: 'none',
            }}
          />
        )
      })}

      {/* glasses heading back down the spoke */}
      {s.glasses.map((g) => {
        const pt = pointAt(g.spoke, g.t)
        return (
          <img
            key={g.id}
            src={ART_SRC(DRINK_TYPES[g.drinkType].icon)}
            alt=""
            className="absolute"
            style={{
              left: `${pt.x}%`,
              top: `${pt.y}%`,
              width: `${3 + 4 * g.t}%`,
              height: 'auto',
              maxWidth: 'none',
              transform: 'translate(-50%, -60%)',
              pointerEvents: 'none',
            }}
          />
        )
      })}

      {/* the jerk, out on the rim */}
      <img
        src={JERK_SRC}
        alt=""
        className="absolute"
        style={{
          left: `${jerk.x}%`,
          top: `${jerk.y}%`,
          height: '13%',
          width: 'auto',
          maxWidth: 'none',
          transform: 'translate(-50%, -70%)',
          filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.6))',
          zIndex: 30,
          pointerEvents: 'none',
        }}
      />

      {s.ended && s.resultText && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 60 }}>
          <div
            className="px-5 py-2 rounded-lg text-center text-xl font-extrabold tracking-[0.06em]"
            style={{
              background: 'rgba(12,10,13,0.85)',
              border: `1px solid ${s.resultKind === 'breach' ? 'rgba(224,89,107,0.5)' : 'rgba(232,200,120,0.5)'}`,
              color: s.resultKind === 'breach' ? '#F07A8A' : '#F2D58C',
              boxShadow: '0 6px 20px rgba(0,0,0,0.55)',
            }}
          >
            {s.resultText}
          </div>
        </div>
      )}
    </div>
  )
}
