import { useRef } from 'react'
import {
  SHAKER_ROWS,
  SHAKER_LAUNCH_ANCHOR,
  BONUS_CUP_COLORS,
} from '../game/constants.js'

// The third bonus round — the jerk again seen from behind (same viewpoint
// as the plate wash), facing three rows of shaker cups scrolling past
// like a sushi conveyor belt on its own counter shelf. The throw is
// Angry-Birds style, same pull-back-and-release physics as BonusLevel's
// wheel round: pull harder to arc higher and reach an upper (smaller,
// harder, higher-paying — see SHAKER_ROWS) row, then land wherever that
// arc actually carries the scoop. Landing on a cup only scores if its
// color matches this throw's flavor (shown up top) — same WRONG CUP
// idea as the wheel round — see stepShaker()/shakerAimStart/Move/End in
// useGameEngine.js for the actual timing/hit logic this mirrors visually.

const ART_SRC = (name) => `${import.meta.env.BASE_URL}art/${name}`
const JERK_THROW_SRC = ART_SRC('jerk-throw.png')
const CUP_SRC = ART_SRC('bonus-cup.png')
const SCOOP_SRC = ART_SRC('bonus-scoop.png')
const SCOOP_BALL_MASK_SRC = ART_SRC('bonus-scoop-ball-mask.png')

// jerk-throw.png is a bust crop (head/shoulders/raised arm, legs cut off)
// of a back-view wind-up pose — legible at a much bigger on-screen size
// than the full-body version was. His raised hand sits at
// roughly this fraction of the image's own width/height, measured from
// its top-left — used to plant the launch anchor exactly on it. Unlike
// BonusLevel's JERK_SCOOP_FRACTION trick (which can convert a width-%
// offset into a height-% one because that arena is forced square),
// ShakerLevel's arena is the whole, non-square phone screen, so the same
// arithmetic would land at the wrong height. Instead the wrapper below is
// positioned AT the anchor point and pulled back by a `transform:
// translate()` in HAND_FRACTION units — percentages there resolve against
// the element's own rendered box, not the containing block, so it lands
// correctly regardless of the arena's aspect ratio.
const JERK_HAND_FRACTION = { x: 0.208, y: 0.197 }
const JERK_WIDTH_PCT = 30

// Same recolor trick as BonusLevel: an opaque tint on top with
// mix-blend-mode "color" (keeps the art's own shading, just recolors the
// hue), clipped to the art's silhouette via mask-image.
function ColorTint({ src, color }) {
  return (
    <div
      className="absolute inset-0"
      style={{
        backgroundColor: color,
        mixBlendMode: 'color',
        WebkitMaskImage: `url(${src})`,
        maskImage: `url(${src})`,
        WebkitMaskSize: 'contain',
        maskSize: 'contain',
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
        maskPosition: 'center',
      }}
    />
  )
}

const TRACK_SRC = ART_SRC('shaker-track.png')
const TRACK_NATIVE_WIDTH = 128 // shaker-track.png's own tile width, for backgroundSize

// A steel dumbwaiter track running the width of the screen under each
// row's cups — actual PixelLab-generated art (a repeating riveted trough)
// instead of a plain CSS line, scrolling in sync with that row's cups so
// it reads as the thing they're physically sliding along.
function ShakerShelves() {
  return (
    <>
      {SHAKER_ROWS.map((row) => (
        <div
          key={row.lane}
          className="absolute inset-x-0 shaker-track-scroll"
          style={{
            top: `${row.y + 9 * row.scale}%`,
            height: `${10 * row.scale}px`,
            backgroundImage: `url(${TRACK_SRC})`,
            backgroundRepeat: 'repeat-x',
            backgroundSize: `${TRACK_NATIVE_WIDTH * row.scale}px 100%`,
            boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
            '--track-shift': `${TRACK_NATIVE_WIDTH * row.scale}px`,
            animationDirection: row.dir < 0 ? 'reverse' : 'normal',
            animationDuration: `${2 * row.scale}s`,
          }}
        />
      ))}
    </>
  )
}

export default function ShakerLevel({ shakerLevel, onAimStart, onAimMove, onAimEnd }) {
  const arenaRef = useRef(null)
  const draggingRef = useRef(false)

  const toArenaPct = (clientX, clientY) => {
    const rect = arenaRef.current.getBoundingClientRect()
    return {
      x: ((clientX - rect.left) / rect.width) * 100,
      y: ((clientY - rect.top) / rect.height) * 100,
    }
  }

  const handlePointerDown = (e) => {
    if (shakerLevel.scoopState !== 'ready') return
    e.preventDefault()
    draggingRef.current = true
    arenaRef.current.setPointerCapture(e.pointerId)
    onAimStart()
  }

  const handlePointerMove = (e) => {
    if (!draggingRef.current) return
    const p = toArenaPct(e.clientX, e.clientY)
    onAimMove(p.x - SHAKER_LAUNCH_ANCHOR.x, p.y - SHAKER_LAUNCH_ANCHOR.y)
  }

  const endDrag = () => {
    if (!draggingRef.current) return
    draggingRef.current = false
    onAimEnd()
  }

  const scoopX = shakerLevel.scoopState === 'aiming' ? SHAKER_LAUNCH_ANCHOR.x + shakerLevel.aimDX : shakerLevel.scoopX
  const scoopY = shakerLevel.scoopState === 'aiming' ? SHAKER_LAUNCH_ANCHOR.y + shakerLevel.aimDY : shakerLevel.scoopY
  const flavor = BONUS_CUP_COLORS[shakerLevel.iceCreamColor]

  return (
    <div
      ref={arenaRef}
      className="absolute inset-0 z-20 overflow-hidden bg-ink select-none"
      style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 78px)', touchAction: 'none' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <div className="flex flex-col items-center pointer-events-none">
        <div className="font-display text-brass text-lg tracking-[0.2em] mb-1">SHAKER SHUFFLE</div>
        <div className="flex items-center gap-1.5 mb-1">
          <div className="rounded-full" style={{ width: 10, height: 10, background: flavor.color, border: '1px solid rgba(255,255,255,0.5)' }} />
          <div className="text-cream/80 text-[11px] tracking-[0.2em]">MATCH THE {flavor.name.toUpperCase()} CUP</div>
        </div>
        <div className="text-cream/60 text-[11px] tracking-[0.2em] mb-1">
          FAR ROW WORTH MORE — PULL BACK &amp; LAUNCH
        </div>
        <div className="font-display text-cream/80 text-sm tracking-widest">
          {shakerLevel.throwsLeft} {shakerLevel.throwsLeft === 1 ? 'THROW' : 'THROWS'} LEFT
        </div>
      </div>

      <div className="absolute inset-0 pointer-events-none">
        <ShakerShelves />

        {SHAKER_ROWS.map((row) => (
          <div key={row.lane} className="absolute inset-x-0" style={{ top: `${row.y}%`, height: 0 }}>
            {shakerLevel.cups
              .filter((cup) => cup.lane === row.lane)
              .map((cup) => (
                <div
                  key={cup.id}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${cup.x}%`, top: 0, width: `${cup.size}%`, aspectRatio: '509 / 734' }}
                >
                  <img src={CUP_SRC} alt="" className="absolute inset-0 w-full h-full" style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))' }} />
                  <ColorTint src={CUP_SRC} color={BONUS_CUP_COLORS[cup.color].color} />
                </div>
              ))}
          </div>
        ))}

        {/* pull-back trajectory guide, only while aiming */}
        {shakerLevel.scoopState === 'aiming' && (
          <svg className="absolute inset-0" width="100%" height="100%" style={{ overflow: 'visible' }}>
            <line
              x1={`${SHAKER_LAUNCH_ANCHOR.x}%`}
              y1={`${SHAKER_LAUNCH_ANCHOR.y}%`}
              x2={`${scoopX}%`}
              y2={`${scoopY}%`}
              stroke="#C6A15B"
              strokeWidth="2"
              strokeDasharray="5 5"
              opacity="0.7"
            />
          </svg>
        )}

        {/* launch anchor marker */}
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            left: `${SHAKER_LAUNCH_ANCHOR.x}%`,
            top: `${SHAKER_LAUNCH_ANCHOR.y}%`,
            width: '3%',
            aspectRatio: '1 / 1',
            background: 'rgba(198,161,91,0.35)',
          }}
        />

        {/* the jerk, seen from behind, winding up to throw — his raised
            hand sits right on the launch anchor so the scoop reads as
            coming out of it. See the JERK_HAND_FRACTION comment above for
            why this uses a transform instead of precomputed left/top. */}
        <div
          style={{
            position: 'absolute',
            left: `${SHAKER_LAUNCH_ANCHOR.x}%`,
            top: `${SHAKER_LAUNCH_ANCHOR.y}%`,
            width: `${JERK_WIDTH_PCT}%`,
            transform: `translate(-${JERK_HAND_FRACTION.x * 100}%, -${JERK_HAND_FRACTION.y * 100}%)`,
            zIndex: 900,
          }}
        >
          <img src={JERK_THROW_SRC} alt="" style={{ display: 'block', width: '100%', height: 'auto' }} />
        </div>

        {/* the ice cream scoop — dragged back to aim, then flies once
            released */}
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${scoopX}%`,
            top: `${scoopY}%`,
            width: '8%',
            aspectRatio: '170 / 205',
            zIndex: 950,
            filter: 'drop-shadow(0 3px 4px rgba(0,0,0,0.6))',
            pointerEvents: shakerLevel.scoopState === 'ready' ? 'auto' : 'none',
          }}
          onPointerDown={handlePointerDown}
        >
          <img src={SCOOP_SRC} alt="" className="absolute inset-0 w-full h-full" />
          <ColorTint src={SCOOP_BALL_MASK_SRC} color={flavor.color} />
        </div>

        {shakerLevel.resultText && shakerLevel.resultHoldMs > 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ zIndex: 1000 }}>
            <div
              className="font-display text-3xl tracking-wide px-6 text-center"
              style={{
                color: shakerLevel.resultKind === 'hit' ? '#E8C878' : '#E0596B',
                textShadow: '0 3px 10px rgba(0,0,0,0.8)',
              }}
            >
              {shakerLevel.resultText}
            </div>
            {/* real 1950s soda-jerk counter slang, so a player who's never
                heard "GLOB!" shouted at them knows it meant they won */}
            {shakerLevel.resultSubtext && (
              <div className="text-cream/70 text-xs tracking-[0.15em] mt-1 px-6 text-center" style={{ textShadow: '0 2px 6px rgba(0,0,0,0.8)' }}>
                ({shakerLevel.resultSubtext})
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
