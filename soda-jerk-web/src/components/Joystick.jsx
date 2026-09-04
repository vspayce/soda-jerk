import { useRef, useState } from 'react'

// A single virtual joystick driving two different mechanics at once:
// horizontal drag is continuous (run left/right along the counter, fires
// start/stop as it crosses the deadzone), vertical drag is discrete (one
// lane change per push past the threshold — re-arms once the stick comes
// back toward center, so holding it deflected doesn't rapid-fire).
//
// Movement is measured relative to wherever the finger first touched
// down, not the base's fixed visual center — a touch rarely lands dead
// center, and judging deflection from the base's geometry would register
// a big accidental push the instant you touch it.
const RADIUS = 46
const DEADZONE = 18
const LANE_THRESHOLD = 32

export default function Joystick({ onUp, onDown, onRunStart, onRunStop }) {
  const draggingRef = useRef(false)
  const startRef = useRef({ x: 0, y: 0 })
  const runDirRef = useRef(0)
  const laneLatchRef = useRef(0)
  const [pos, setPos] = useState({ x: 0, y: 0 })

  const reset = () => {
    if (draggingRef.current && runDirRef.current !== 0) onRunStop()
    draggingRef.current = false
    runDirRef.current = 0
    laneLatchRef.current = 0
    setPos({ x: 0, y: 0 })
  }

  const handleMove = (clientX, clientY) => {
    let dx = clientX - startRef.current.x
    let dy = clientY - startRef.current.y
    const dist = Math.hypot(dx, dy)
    if (dist > RADIUS) {
      dx = (dx / dist) * RADIUS
      dy = (dy / dist) * RADIUS
    }
    setPos({ x: dx, y: dy })

    if (dx > DEADZONE) {
      if (runDirRef.current !== 1) {
        runDirRef.current = 1
        onRunStart(1)
      }
    } else if (dx < -DEADZONE) {
      if (runDirRef.current !== -1) {
        runDirRef.current = -1
        onRunStart(-1)
      }
    } else if (runDirRef.current !== 0) {
      runDirRef.current = 0
      onRunStop()
    }

    if (dy < -LANE_THRESHOLD) {
      if (laneLatchRef.current !== -1) {
        laneLatchRef.current = -1
        onUp()
      }
    } else if (dy > LANE_THRESHOLD) {
      if (laneLatchRef.current !== 1) {
        laneLatchRef.current = 1
        onDown()
      }
    } else {
      laneLatchRef.current = 0
    }
  }

  return (
    <div
      className="relative rounded-full pointer-events-auto touch-none select-none"
      style={{ width: 100, height: 100, background: 'rgba(21,16,20,0.5)', border: '2px solid rgba(198,161,91,0.45)' }}
      onPointerDown={(e) => {
        e.preventDefault()
        draggingRef.current = true
        startRef.current = { x: e.clientX, y: e.clientY }
        e.currentTarget.setPointerCapture(e.pointerId)
      }}
      onPointerMove={(e) => {
        if (!draggingRef.current) return
        handleMove(e.clientX, e.clientY)
      }}
      onPointerUp={reset}
      onPointerCancel={reset}
      aria-label="Move — drag up/down to change bars, left/right to run"
    >
      {/* faint direction ticks */}
      <div className="absolute inset-0 opacity-40 text-brass">
        <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
          <path d="M50 10l4 7h-8z" fill="currentColor" />
          <path d="M50 90l4-7h-8z" fill="currentColor" />
          <path d="M10 50l7-4v8z" fill="currentColor" />
          <path d="M90 50l-7-4v8z" fill="currentColor" />
        </svg>
      </div>

      <div
        className="absolute rounded-full border-2 border-brass"
        style={{
          width: 46,
          height: 46,
          left: '50%',
          top: '50%',
          transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px))`,
          background: 'linear-gradient(180deg, #C6A15B 0%, #8A6E37 100%)',
          boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
          transition: draggingRef.current ? 'none' : 'transform 150ms ease-out',
        }}
      />
    </div>
  )
}
