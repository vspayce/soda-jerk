// The converging-hallway look from the original arcade cabinet, done
// entirely in CSS (clip-path trapezoids) — no art assets needed. Walls
// recede to a lit vanishing point behind an art-deco stepped arch, with
// fluted pilaster texture, a couple of wall sconces per side, and one
// dramatic diagonal light source cutting across everything, Hopper-style.

// Wall trapezoids: at y=0% each wall's inner edge sits at WALL_TOP,
// widening to WALL_BOTTOM at y=100%. Sconces below are placed along the
// same slant so they sit "on" the wall instead of floating free of it.
const WALL_TOP = 48 // inner-edge x%, at the vanishing point
const WALL_BOTTOM = 0 // inner-edge x%, at the floor

function wallCenterX(side, yPct) {
  const inner = WALL_TOP - (WALL_TOP - WALL_BOTTOM) * (yPct / 100)
  const outer = inner + 12
  const mid = (inner + outer) / 2
  return side === 'left' ? mid : 100 - mid
}

const SCONCE_YS = [32, 66]

const ART_SRC = (name) => `${import.meta.env.BASE_URL}art/${name}`

// A repeating ogee/swirl damask, echoing the wallpaper behind the counter
// in the splash art — replaces the old straight brass fluting lines.
const SWIRL_PATTERN =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Cpath d='M15 30c0-10 8-16 15-16s15 6 15 16-8 16-15 16-15-6-15-16z' stroke='%23EDE3D0' stroke-width='1' fill='none' opacity='0.6'/%3E%3Cpath d='M0 0c15 0 15 15 30 15s15-15 30-15M0 60c15 0 15-15 30-15s15 15 30 15' stroke='%23EDE3D0' stroke-width='1' fill='none' opacity='0.6'/%3E%3C/svg%3E"

// Corner flourish — a curling scroll, replacing the old geometric
// sunburst fan, to match the swirl filigree on the "SODA JERK" sign.
function CornerSwirl({ corner }) {
  const isLeft = corner.includes('l')
  const isTop = corner.includes('t')
  return (
    <svg
      className="absolute opacity-[0.16]"
      style={{
        top: isTop ? 0 : undefined,
        bottom: isTop ? undefined : 0,
        left: isLeft ? 0 : undefined,
        right: isLeft ? undefined : 0,
        width: 70,
        height: 70,
        transform: `scale(${isLeft ? 1 : -1}, ${isTop ? 1 : -1})`,
      }}
      viewBox="0 0 70 70"
      fill="none"
    >
      <path
        d="M2 2c0 24 4 40 12 48M2 2c24 0 40 4 48 12M14 14c8 5 11 13 8 20-2 5-8 7-12 4-3-2-4-6-1-8"
        stroke="#C6A15B"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="2" cy="2" r="2.2" fill="#C6A15B" />
    </svg>
  )
}

export default function PerspectiveBackdrop() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* deep base shadow */}
      <div className="absolute inset-0" style={{ background: '#0C0A0D' }} />

      {/* glow at the vanishing point — implies a lit archway at the far
          end of the hallway, behind the doors each lane opens onto */}
      <div
        className="absolute left-1/2 top-0 -translate-x-1/2"
        style={{
          width: '70%',
          height: '40%',
          background: 'radial-gradient(ellipse at 50% 0%, rgba(232,200,120,0.28) 0%, transparent 70%)',
        }}
      />

      {/* left wall panel, converging toward the vanishing point */}
      <div
        className="absolute inset-0"
        style={{
          clipPath: 'polygon(46% 0%, 50% 0%, 6% 100%, -6% 100%)',
          background: 'linear-gradient(180deg, #8A6E37 0%, #151014 70%)',
        }}
      />
      {/* left wall — swirl damask, same slant as the wall */}
      <div
        className="absolute inset-0 opacity-[0.14]"
        style={{
          clipPath: 'polygon(46% 0%, 50% 0%, 6% 100%, -6% 100%)',
          backgroundImage: `url("${SWIRL_PATTERN}")`,
          backgroundSize: '60px 60px',
        }}
      />

      {/* right wall panel */}
      <div
        className="absolute inset-0"
        style={{
          clipPath: 'polygon(50% 0%, 54% 0%, 106% 100%, 94% 100%)',
          background: 'linear-gradient(180deg, #8A6E37 0%, #151014 70%)',
        }}
      />
      {/* right wall — swirl damask */}
      <div
        className="absolute inset-0 opacity-[0.14]"
        style={{
          clipPath: 'polygon(50% 0%, 54% 0%, 106% 100%, 94% 100%)',
          backgroundImage: `url("${SWIRL_PATTERN}")`,
          backgroundSize: '60px 60px',
        }}
      />

      {/* wall sconces — small glowing brass lamps set into each wall */}
      {SCONCE_YS.flatMap((yPct) =>
        ['left', 'right'].map((side) => (
          <div
            key={`${side}-${yPct}`}
            className="absolute rounded-full"
            style={{
              left: `${wallCenterX(side, yPct)}%`,
              top: `${yPct}%`,
              width: 7,
              height: 7,
              transform: 'translate(-50%, -50%)',
              background: '#E8C878',
              boxShadow: '0 0 10px 3px rgba(232,200,120,0.55)',
            }}
          />
        ))
      )}

      {/* single dramatic light source, cutting across everything at an
          angle — the core Hopper move: one hard-edged wedge of warm
          light against otherwise flat shadow */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(115deg, transparent 35%, rgba(198,161,91,0.22) 48%, transparent 62%)',
          mixBlendMode: 'screen',
        }}
      />

      {/* corner swirl flourishes, top and bottom */}
      <CornerSwirl corner="tl" />
      <CornerSwirl corner="tr" />
      <CornerSwirl corner="bl" />
      <CornerSwirl corner="br" />

      {/* stepped cove molding beneath the vanishing point, framing the sign */}
      <div className="absolute left-1/2 top-0 -translate-x-1/2 flex flex-col items-center">
        {[46, 34, 22].map((w, i) => (
          <div key={i} style={{ width: w, height: 3, marginTop: i === 0 ? 0 : 1, background: '#C6A15B', opacity: 0.5 - i * 0.1 }} />
        ))}
      </div>

      {/* overhead signage banner — the same logo lockup as the splash
          screen, sized to clear the lives icons in the HUD row */}
      <img
        src={ART_SRC('soda-jerk-logo.png')}
        alt="Soda Jerk"
        className="absolute left-1/2 -translate-x-1/2"
        style={{ top: 44, height: 24, width: 'auto' }}
      />

      {/* Mighty Wurlitzer, front and center up top */}
      <img
        src={ART_SRC('wurlitzer.png')}
        alt=""
        className="absolute left-1/2 -translate-x-1/2 opacity-95"
        style={{ top: '9%', width: '24%', height: 'auto' }}
      />

    </div>
  )
}
