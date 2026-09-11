import { useRef, useState } from 'react'
import {
  SLIDE_BARS,
  SLIDE_MIN_FLICK,
  SLIDE_MAX_FLICK,
  SLIDE_GLASS_NEAR_PCT,
  SLIDE_GLASS_FAR_PCT,
  DRINK_TYPES,
} from '../game/constants.js'

const ART_SRC = (name) => `${import.meta.env.BASE_URL}art/${name}`

const PATRON_SRC = (patronType, drinkType) => {
  const n = patronType === 0 ? 'patron' : `patron${patronType + 1}`
  return ART_SRC(`${n}-${drinkType === 0 ? 'orange' : 'pink'}.png`)
}

const BAR_BY_LANE = Object.fromEntries(SLIDE_BARS.map((b) => [b.lane, b]))

// Bar width in x-percent at each end — the taper is what sells the
// perspective, since every bar runs away from the player.
const BAR_NEAR_W = 11
const BAR_FAR_W = 3

// Anywhere along a bar, 0 at the near end and 1 at the far end. Everything
// on a bar — glasses, patrons — is placed through this, so the bars can be
// re-angled in constants.js without touching the component.
const pointAt = (bar, t) => ({
  x: bar.near.x + (bar.far.x - bar.near.x) * t,
  y: bar.near.y + (bar.far.y - bar.near.y) * t,
})

const glassSizeAt = (t) => SLIDE_GLASS_NEAR_PCT + (SLIDE_GLASS_FAR_PCT - SLIDE_GLASS_NEAR_PCT) * t

export default function SlideLevel({ slideLevel, onFlick }) {
  const arenaRef = useRef(null)
  const dragRef = useRef(null)
  const [aim, setAim] = useState(null) // { lane, amount } while dragging

  const toPct = (e) => {
    const r = arenaRef.current.getBoundingClientRect()
    return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }
  }

  const start = (lane) => (e) => {
    if (slideLevel.ended) return
    e.preventDefault()
    arenaRef.current.setPointerCapture(e.pointerId)
    dragRef.current = { lane, from: toPct(e) }
    setAim({ lane, amount: 0 })
  }

  // The flick is measured as its projection onto the bar's OWN direction, so
  // a swipe "up the bar" counts the same on every bar whatever its angle,
  // and sideways wobble doesn't add power.
  const flickAlong = (lane, from, to) => {
    const bar = BAR_BY_LANE[lane]
    const bx = bar.far.x - bar.near.x
    const by = bar.far.y - bar.near.y
    const len = Math.hypot(bx, by)
    return (((to.x - from.x) * bx + (to.y - from.y) * by) / len) / 100
  }

  const move = (e) => {
    const d = dragRef.current
    if (!d) return
    setAim({ lane: d.lane, amount: Math.max(0, flickAlong(d.lane, d.from, toPct(e))) })
  }

  const end = (e) => {
    const d = dragRef.current
    if (!d) return
    dragRef.current = null
    const amount = flickAlong(d.lane, d.from, toPct(e))
    setAim(null)
    if (amount > 0) onFlick(d.lane, amount)
  }

  return (
    <div
      ref={arenaRef}
      className="absolute inset-0 z-20 overflow-hidden bg-ink select-none"
      style={{ touchAction: 'none' }}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
    >
      <div
        className="absolute inset-x-0 flex flex-col items-center"
        style={{ top: 'calc(env(safe-area-inset-top, 0px) + 74px)', zIndex: 40 }}
      >
        <div className="font-display text-brass text-lg tracking-[0.2em]">GLASS SLIDE</div>
        <div className="text-cream/60 text-[11px] tracking-[0.2em] mt-1">
          KEEP THEM BACK — SWIPE UP A BAR
        </div>
        <div className="font-display text-cream/80 text-sm tracking-widest mt-1">
          {slideLevel.served} SERVED
        </div>
      </div>

      {/* Drawn as tapered quads rather than lines: a constant-width stroke
          reads as a skewer, and the whole point is that these are counters
          running away from you. */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {SLIDE_BARS.map((bar) => {
          const a = pointAt(bar, 0)
          const b = pointAt(bar, 1)
          const quad = (w0, w1) =>
            `${a.x - w0 / 2},${a.y} ${a.x + w0 / 2},${a.y} ${b.x + w1 / 2},${b.y} ${b.x - w1 / 2},${b.y}`
          return (
            <g key={bar.lane}>
              <polygon points={quad(BAR_NEAR_W, BAR_FAR_W)} fill="#6B5334" />
              <polygon points={quad(BAR_NEAR_W * 0.45, BAR_FAR_W * 0.45)} fill="#8A6E44" opacity={0.85} />
            </g>
          )
        })}
      </svg>

      {/* patrons coming down the bars toward you */}
      {slideLevel.patrons.map((p) => {
        const bar = BAR_BY_LANE[p.lane]
        const pt = pointAt(bar, Math.max(0, p.t))
        return (
          <img
            key={p.id}
            src={PATRON_SRC(p.patronType, p.drinkType)}
            alt=""
            className="absolute"
            style={{
              left: `${pt.x}%`,
              top: `${pt.y}%`,
              // Bigger as they get closer, so the bar reads as depth.
              height: `${13 - 6 * p.t}%`,
              width: 'auto',
              maxWidth: 'none',
              transform: 'translate(-50%, -88%)',
              filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.6))',
            }}
          />
        )
      })}

      {/* glasses on their way up */}
      {slideLevel.glasses.map((g) => {
        const bar = BAR_BY_LANE[g.lane]
        const pt = pointAt(bar, Math.min(g.t, 1.06))
        return (
          <img
            key={g.id}
            src={ART_SRC(DRINK_TYPES[g.drinkType].icon)}
            alt=""
            className="absolute"
            style={{
              left: `${pt.x}%`,
              top: `${pt.y}%`,
              width: `${glassSizeAt(Math.min(g.t, 1))}%`,
              height: 'auto',
              maxWidth: 'none',
              transform: 'translate(-50%, -72%)',
              filter: 'drop-shadow(0 3px 5px rgba(0,0,0,0.55))',
            }}
          />
        )
      })}

      {/* how hard the current flick is, drawn along the bar being swiped */}
      {aim && aim.amount > 0 && (() => {
        const bar = BAR_BY_LANE[aim.lane]
        const n = Math.min(1, Math.max(0, (aim.amount - SLIDE_MIN_FLICK) / (SLIDE_MAX_FLICK - SLIDE_MIN_FLICK)))
        const p = pointAt(bar, n)
        return (
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
            <line
              x1={bar.near.x} y1={bar.near.y} x2={p.x} y2={p.y}
              stroke="#E8C878" strokeWidth={5} strokeLinecap="round" opacity={0.85}
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        )
      })()}

      {/* The near end of each bar is the grab handle. Kept up off the
          bottom edge on purpose — a swipe starting down there gets eaten by
          the iOS app-switcher gesture instead of reaching the game. */}
      {SLIDE_BARS.map((bar) => {
        const p = pointAt(bar, 0.1)
        return (
          <div
            key={bar.lane}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${p.x}%`, top: `${p.y}%`, width: '34%', height: '17%', touchAction: 'none' }}
            onPointerDown={start(bar.lane)}
          />
        )
      })}

      {slideLevel.ended && slideLevel.resultText && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 60 }}>
          <div
            className="px-5 py-2 rounded-lg text-center text-xl font-extrabold tracking-[0.06em]"
            style={{
              background: 'rgba(12,10,13,0.85)',
              border: '1px solid rgba(224,89,107,0.5)',
              color: '#F07A8A',
              boxShadow: '0 6px 20px rgba(0,0,0,0.55)',
            }}
          >
            {slideLevel.resultText}
          </div>
        </div>
      )}
    </div>
  )
}
