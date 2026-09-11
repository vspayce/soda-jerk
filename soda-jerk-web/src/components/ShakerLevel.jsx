import { useEffect, useRef, useState } from 'react'
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

  // Replay the throw motion every time a scoop actually leaves the hand.
  // Bumping a key to remount the sprite restarts the animation cleanly —
  // toggling a class alone silently no-ops when a new throw begins while
  // the previous one is still playing.
  const prevScoopState = useRef(shakerLevel.scoopState)
  const [throwCount, setThrowCount] = useState(0)
  useEffect(() => {
    if (prevScoopState.current !== 'flying' && shakerLevel.scoopState === 'flying') {
      setThrowCount((n) => n + 1)
    }
    prevScoopState.current = shakerLevel.scoopState
  }, [shakerLevel.scoopState])

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
          {/* Animation goes on the img, not the wrapper — the wrapper's
              transform is what plants his hand on the launch anchor, and
              an animated transform would replace it outright. */}
          <img
            key={throwCount}
            src={JERK_THROW_SRC}
            alt=""
            className={throwCount > 0 ? 'jerk-throwing' : undefined}
            style={{ display: 'block', width: '100%', height: 'auto' }}
          />
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
            {/* The slang is the whole joke, so it has to be readable at a
                glance over a busy belt of cups. Playfair (font-display) is
                a thin high-contrast serif — fine for the SODA JERK sign,
                bad for a short shouted word flashing past — so this sets
                the term in the body face, heavy and tight, on a solid
                plate rather than relying on a drop shadow to carry it. */}
            <div
              className="px-5 py-2 rounded-lg text-center"
              style={{
                background: 'rgba(12,10,13,0.82)',
                border: `1px solid ${shakerLevel.resultKind === 'hit' ? 'rgba(232,200,120,0.55)' : 'rgba(224,89,107,0.45)'}`,
                boxShadow: '0 6px 20px rgba(0,0,0,0.55)',
                maxWidth: '86%',
              }}
            >
              <div
                className="text-2xl font-extrabold tracking-[0.06em]"
                style={{ color: shakerLevel.resultKind === 'hit' ? '#F2D58C' : '#F07A8A' }}
              >
                {shakerLevel.resultText}
              </div>
              {/* real 1950s soda-jerk counter slang, so a player who's never
                  heard "GLOB!" shouted at them knows it meant they won */}
              {shakerLevel.resultSubtext && (
                <div className="text-cream/90 text-[13px] leading-snug tracking-[0.06em] mt-1">
                  {shakerLevel.resultSubtext}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
