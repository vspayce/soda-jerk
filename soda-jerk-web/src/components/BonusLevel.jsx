import { useRef } from 'react'
import {
  BONUS_WHEEL_CENTER,
  BONUS_WHEEL_IMAGE_SIZE,
  BONUS_WHEEL_HOLE_FRACTION_X,
  BONUS_WHEEL_HOLE_FRACTION_Y,
  BONUS_CUP_SIZE,
  BONUS_CUP_COLORS,
  BONUS_LAUNCH_ANCHOR,
} from '../game/constants.js'

// The wheel-throw bonus round. Everything here is positioned in
// percentages of this component's own square arena div — not the phone
// frame — so the throw physics (circular wheel, straight gravity arc)
// stay visually correct no matter the device's actual aspect ratio.

const ART_SRC = (name) => `${import.meta.env.BASE_URL}art/${name}`
const WHEEL_SRC = ART_SRC('bonus-wheel.png')
const CUP_SRC = ART_SRC('bonus-cup.png')
const SCOOP_SRC = ART_SRC('bonus-scoop.png')
const SCOOP_BALL_MASK_SRC = ART_SRC('bonus-scoop-ball-mask.png')
const JERK_SRC = ART_SRC('bonus-jerk.png')

// bonus-jerk.png is 599x1403; his held scoop sits at roughly this
// fraction of the image's own width/height, measured from its top-left —
// used to plant that held scoop exactly on the launch anchor, so the
// thrown scoop reads as coming right out of his hand.
const JERK_ASPECT = 1403 / 599
const JERK_SCOOP_FRACTION = { x: 0.142, y: 0.208 }
const JERK_WIDTH_PCT = 24
const JERK_LEFT_PCT = BONUS_LAUNCH_ANCHOR.x - JERK_SCOOP_FRACTION.x * JERK_WIDTH_PCT
const JERK_TOP_PCT = BONUS_LAUNCH_ANCHOR.y - JERK_SCOOP_FRACTION.y * JERK_WIDTH_PCT * JERK_ASPECT

// Both the metal cups and the plain off-white scoop art are recolored the
// same way: an opaque tint sits on top with mix-blend-mode "color" (which
// keeps the art's own shading/highlights, just recolors the hue), clipped
// to the art's own silhouette via mask-image so the tint doesn't bleed
// onto whatever's rendered behind it.
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

export default function BonusLevel({ bonusLevel, onAimStart, onAimMove, onAimEnd }) {
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
    if (bonusLevel.scoopState !== 'ready') return
    e.preventDefault()
    draggingRef.current = true
    // Without this, a pull that drags past the arena's own edge (easy to
    // do — the anchor sits near the bottom) stops receiving move/up
    // events the instant the pointer leaves the element, leaving the
    // scoop stuck mid-aim forever.
    arenaRef.current.setPointerCapture(e.pointerId)
    onAimStart()
  }

  const handlePointerMove = (e) => {
    if (!draggingRef.current) return
    const p = toArenaPct(e.clientX, e.clientY)
    onAimMove(p.x - BONUS_LAUNCH_ANCHOR.x, p.y - BONUS_LAUNCH_ANCHOR.y)
  }

  const endDrag = () => {
    if (!draggingRef.current) return
    draggingRef.current = false
    onAimEnd()
  }

  const scoopX = bonusLevel.scoopState === 'aiming' ? BONUS_LAUNCH_ANCHOR.x + bonusLevel.aimDX : bonusLevel.scoopX
  const scoopY = bonusLevel.scoopState === 'aiming' ? BONUS_LAUNCH_ANCHOR.y + bonusLevel.aimDY : bonusLevel.scoopY
  const flavor = BONUS_CUP_COLORS[bonusLevel.iceCreamColor]

  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center bg-ink" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 78px)' }}>
      <div className="font-display text-brass text-lg tracking-[0.2em] mb-1">BONUS ROUND</div>
      <div className="flex items-center gap-1.5 mb-1">
        <div className="rounded-full" style={{ width: 10, height: 10, background: flavor.color, border: '1px solid rgba(255,255,255,0.5)' }} />
        <div className="text-cream/80 text-[11px] tracking-[0.2em]">MATCH THE {flavor.name.toUpperCase()} CUP</div>
      </div>
      <div className="text-cream/60 text-[11px] tracking-[0.25em] mb-3">
        PULL BACK &amp; LAUNCH — {bonusLevel.throwsLeft} {bonusLevel.throwsLeft === 1 ? 'THROW' : 'THROWS'} LEFT
      </div>

      <div
        ref={arenaRef}
        className="relative select-none"
        style={{ width: 'min(92vw, 58vh)', aspectRatio: '1 / 1', touchAction: 'none' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        {/* the soda jerk himself, standing next to the wheel — his held
            scoop is planted right on the launch anchor, so the thrown
            scoop reads as coming out of his hand */}
        <img
          src={JERK_SRC}
          alt=""
          className="absolute pointer-events-none"
          style={{ left: `${JERK_LEFT_PCT}%`, top: `${JERK_TOP_PCT}%`, width: `${JERK_WIDTH_PCT}%`, zIndex: 1 }}
        />

        {/* The wheel image and its 4 cups all rotate together as one
            rigid group — the cups sit at fixed base angles (0/90/180/270)
            within this wrapper, and the wrapper's own rotation carries
            them around, same as they're physically mounted on the wheel. */}
        <div
          className="absolute"
          style={{
            left: `${BONUS_WHEEL_CENTER.x}%`,
            top: `${BONUS_WHEEL_CENTER.y}%`,
            width: `${BONUS_WHEEL_IMAGE_SIZE}%`,
            aspectRatio: '1 / 1',
            transform: `translate(-50%, -50%) rotate(${bonusLevel.wheelAngle}deg)`,
          }}
        >
          <img src={WHEEL_SRC} alt="" className="absolute inset-0 w-full h-full" style={{ filter: 'drop-shadow(0 6px 14px rgba(0,0,0,0.6))' }} />
          {BONUS_CUP_COLORS.map((cup, i) => {
            const rad = ((i * 90) * Math.PI) / 180
            const x = 50 + BONUS_WHEEL_HOLE_FRACTION_X * 100 * Math.cos(rad)
            const y = 50 + BONUS_WHEEL_HOLE_FRACTION_Y * 100 * Math.sin(rad)
            return (
              <div
                key={cup.name}
                className="absolute"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  width: `${(BONUS_CUP_SIZE / BONUS_WHEEL_IMAGE_SIZE) * 100}%`,
                  aspectRatio: '509 / 734',
                  // Counter-rotate against the wrapper's spin — the cups
                  // orbit around the wheel with it, but always stay
                  // upright, same as baskets on a real spinning wheel.
                  transform: `translate(-50%, -50%) rotate(${-bonusLevel.wheelAngle}deg)`,
                }}
              >
                <img src={CUP_SRC} alt="" className="absolute inset-0 w-full h-full" />
                <ColorTint src={CUP_SRC} color={cup.color} />
              </div>
            )
          })}
        </div>

        {/* pull-back trajectory guide, only while aiming */}
        {bonusLevel.scoopState === 'aiming' && (
          <svg className="absolute inset-0 pointer-events-none" width="100%" height="100%" style={{ overflow: 'visible' }}>
            <line
              x1={`${BONUS_LAUNCH_ANCHOR.x}%`}
              y1={`${BONUS_LAUNCH_ANCHOR.y}%`}
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
            left: `${BONUS_LAUNCH_ANCHOR.x}%`,
            top: `${BONUS_LAUNCH_ANCHOR.y}%`,
            width: '3%',
            aspectRatio: '1 / 1',
            background: 'rgba(198,161,91,0.35)',
          }}
        />

        {/* the ice cream scoop — dragged back to aim, then flies once
            released. The ball on top is tinted to this throw's flavor;
            the metal scoop underneath stays plain. */}
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${scoopX}%`,
            top: `${scoopY}%`,
            width: '8%',
            aspectRatio: '170 / 205',
            zIndex: 3,
            filter: 'drop-shadow(0 3px 4px rgba(0,0,0,0.6))',
          }}
          onPointerDown={handlePointerDown}
        >
          <img src={SCOOP_SRC} alt="" className="absolute inset-0 w-full h-full" />
          <ColorTint src={SCOOP_BALL_MASK_SRC} color={flavor.color} />
        </div>

        {bonusLevel.scoopState === 'result' && (
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ zIndex: 4 }}
          >
            <div
              className="font-display text-3xl tracking-wide px-6 py-2"
              style={{
                color: bonusLevel.resultText?.startsWith('HIT') ? '#E8C878' : '#E0596B',
                textShadow: '0 3px 10px rgba(0,0,0,0.8)',
              }}
            >
              {bonusLevel.resultText}
            </div>
          </div>
        )}
      </div>

      <div className="text-cream/50 text-[11px] tracking-[0.2em] mt-4">
        DRAG THE SCOOP BACK, THEN LET GO
      </div>
    </div>
  )
}
