import {
  SHAKER_ROWS,
  SHAKER_CUP_SIZE_PCT,
  SHAKER_TARGET_X,
  SHAKER_TARGET_TOLERANCE_PCT,
  SHAKER_THROW_TRAVEL_MS,
  BONUS_CUP_COLORS,
  PLAYER_X,
} from '../game/constants.js'

// The third bonus round — the jerk again seen from behind (same viewpoint
// as the plate wash), this time facing three shaker cups that each slide
// back and forth along their own row. Tapping a row throws a scoop into
// it; the scoop always lands at SHAKER_TARGET_X after a fixed travel
// time, so landing it is purely about tapping when that row's cup is
// passing through the target zone — see stepShaker()/shakerThrow() in
// useGameEngine.js for the actual timing/hit logic this mirrors visually.

const ART_SRC = (name) => `${import.meta.env.BASE_URL}art/${name}`
const JERK_BACK_SRC = ART_SRC('jerk-back.png')
const CUP_SRC = ART_SRC('bonus-cup.png')
const SCOOP_SRC = ART_SRC('bonus-scoop.png')
const SCOOP_BALL_MASK_SRC = ART_SRC('bonus-scoop-ball-mask.png')

const ROW_BY_LANE = Object.fromEntries(SHAKER_ROWS.map((row) => [row.lane, row]))
// The scoop launches from roughly where the jerk's raised hand is, same
// spirit as BonusLevel's JERK_SCOOP_FRACTION anchor.
const LAUNCH_X = PLAYER_X + 8
const LAUNCH_Y = 92

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

export default function ShakerLevel({ shakerLevel, onThrow }) {
  return (
    <div className="absolute inset-0 z-20 overflow-hidden bg-ink" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 78px)' }}>
      <div className="flex flex-col items-center">
        <div className="font-display text-brass text-lg tracking-[0.2em] mb-1">SHAKER SHUFFLE</div>
        <div className="text-cream/60 text-[11px] tracking-[0.2em] mb-1">TAP A ROW WHEN THE CUP LINES UP</div>
        <div className="font-display text-cream/80 text-sm tracking-widest">
          {shakerLevel.throwsLeft} {shakerLevel.throwsLeft === 1 ? 'THROW' : 'THROWS'} LEFT
        </div>
      </div>

      <div className="absolute inset-0">
        {/* target zone — a soft vertical band every row's throw lands in */}
        <div
          className="absolute top-0 bottom-0 pointer-events-none"
          style={{
            left: `${SHAKER_TARGET_X - SHAKER_TARGET_TOLERANCE_PCT}%`,
            width: `${SHAKER_TARGET_TOLERANCE_PCT * 2}%`,
            background: 'linear-gradient(180deg, rgba(198,161,91,0.12) 0%, rgba(198,161,91,0.05) 100%)',
            borderLeft: '1px dashed rgba(198,161,91,0.35)',
            borderRight: '1px dashed rgba(198,161,91,0.35)',
          }}
        />

        {shakerLevel.cups.map((cup) => (
          <div
            key={cup.lane}
            className="absolute inset-x-0 -translate-y-1/2"
            style={{ top: `${cup.y}%`, height: '18%', touchAction: 'none' }}
            onPointerDown={(e) => {
              e.preventDefault()
              onThrow(cup.lane)
            }}
          >
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${cup.x}%`, top: '50%', width: `${SHAKER_CUP_SIZE_PCT}%`, aspectRatio: '509 / 734' }}
            >
              <img src={CUP_SRC} alt="" className="absolute inset-0 w-full h-full" style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))' }} />
              <ColorTint src={CUP_SRC} color={BONUS_CUP_COLORS[cup.color].color} />
            </div>
          </div>
        ))}

        {shakerLevel.scoops.map((scoop) => {
          const row = ROW_BY_LANE[scoop.lane]
          const cup = shakerLevel.cups.find((c) => c.lane === scoop.lane)
          const t = Math.min(scoop.progress, 1)
          const x = LAUNCH_X + (SHAKER_TARGET_X - LAUNCH_X) * t
          const y = LAUNCH_Y + (row.y - LAUNCH_Y) * t
          return (
            <div
              key={scoop.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              style={{ left: `${x}%`, top: `${y}%`, width: '8%', aspectRatio: '170 / 205', zIndex: 500, filter: 'drop-shadow(0 3px 4px rgba(0,0,0,0.6))' }}
            >
              <img src={SCOOP_SRC} alt="" className="absolute inset-0 w-full h-full" />
              <ColorTint src={SCOOP_BALL_MASK_SRC} color={BONUS_CUP_COLORS[cup?.color ?? 0].color} />
            </div>
          )
        })}

        {shakerLevel.resultText && shakerLevel.resultHoldMs > 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 1000 }}>
            <div
              className="font-display text-3xl tracking-wide px-6 py-2 text-center"
              style={{
                color: shakerLevel.resultText === 'HIT!' ? '#E8C878' : '#E0596B',
                textShadow: '0 3px 10px rgba(0,0,0,0.8)',
              }}
            >
              {shakerLevel.resultText}
            </div>
          </div>
        )}
      </div>

      {/* the soda jerk, seen from behind — same point of view as the
          plate-wash round */}
      <img
        src={JERK_BACK_SRC}
        alt=""
        className="absolute pointer-events-none"
        style={{ left: '50%', bottom: 0, transform: 'translateX(-50%)', height: '34vh', width: 'auto', zIndex: 900 }}
      />
    </div>
  )
}
