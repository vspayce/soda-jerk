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

// Row of syrup bottles on a back-bar shelf, just under the signage.
const BOTTLE_COLORS = ['#7A1F2B', '#1B6F62', '#8A6E37', '#4A3F6B', '#B8562E', '#7A1F2B', '#1B6F62']

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
      {/* left wall fluting — thin vertical brass lines, same slant as the wall */}
      <div
        className="absolute inset-0 opacity-[0.14]"
        style={{
          clipPath: 'polygon(46% 0%, 50% 0%, 6% 100%, -6% 100%)',
          background: 'repeating-linear-gradient(90deg, #EDE3D0 0 1px, transparent 1px 5%)',
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
      {/* right wall fluting */}
      <div
        className="absolute inset-0 opacity-[0.14]"
        style={{
          clipPath: 'polygon(50% 0%, 54% 0%, 106% 100%, 94% 100%)',
          background: 'repeating-linear-gradient(90deg, #EDE3D0 0 1px, transparent 1px 5%)',
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

      {/* corner fans, contained to the top corners */}
      <div
        className="absolute top-0 left-0 opacity-[0.12]"
        style={{
          width: 90,
          height: 90,
          clipPath: 'circle(100% at 0 0)',
          background: 'repeating-conic-gradient(from 0deg at 0 0, #C6A15B 0deg 3deg, transparent 3deg 9deg)',
        }}
      />
      <div
        className="absolute top-0 right-0 opacity-[0.12]"
        style={{
          width: 90,
          height: 90,
          clipPath: 'circle(100% at 100% 0)',
          background: 'repeating-conic-gradient(from 0deg at 100% 0, #C6A15B 0deg 3deg, transparent 3deg 9deg)',
        }}
      />

      {/* stepped cove molding beneath the vanishing point, framing the sign */}
      <div className="absolute left-1/2 top-0 -translate-x-1/2 flex flex-col items-center">
        {[46, 34, 22].map((w, i) => (
          <div key={i} style={{ width: w, height: 3, marginTop: i === 0 ? 0 : 1, background: '#C6A15B', opacity: 0.5 - i * 0.1 }} />
        ))}
      </div>

      {/* overhead signage banner */}
      <div
        className="absolute left-1/2 -translate-x-1/2 top-3 px-5 py-1.5 rounded-sm border-2"
        style={{
          background: '#7A1F2B',
          borderColor: '#C6A15B',
          clipPath: 'polygon(6% 0%, 94% 0%, 100% 50%, 94% 100%, 6% 100%, 0% 50%)',
        }}
      >
        <span className="font-display text-cream text-xs tracking-[0.2em]">SODA JERK</span>
      </div>

      {/* back-bar shelf of syrup bottles, just under the sign */}
      <div className="absolute left-0 right-0 flex items-end justify-center gap-2 opacity-70" style={{ top: '14%' }}>
        {BOTTLE_COLORS.map((color, i) => (
          <svg key={i} width="10" height={i % 2 === 0 ? 22 : 18} viewBox="0 0 10 22">
            <rect x="3.5" y="0" width="3" height="5" fill="#C6A15B" />
            <path d="M2 5 L8 5 L9 22 L1 22 Z" fill={color} stroke="#151014" strokeWidth="0.6" />
          </svg>
        ))}
      </div>

      {/* Wurlitzer jukebox, tucked in the top margin above the lanes so it
          isn't hidden behind the counters */}
      <div className="absolute opacity-90" style={{ right: '4%', top: '4%', width: 34, height: 60 }}>
        <svg width="34" height="60" viewBox="0 0 46 82">
          <path d="M4 82 L4 20 Q4 3 23 3 Q42 3 42 20 L42 82 Z" fill="#3B2A1C" stroke="#151014" strokeWidth="1.4" />
          <path d="M8 82 L8 22 Q8 8 23 8 Q38 8 38 22 L38 82 Z" fill="#151014" />
          {['#C6A15B', '#7A1F2B', '#1B6F62', '#C6A15B'].map((c, i) => (
            <rect key={i} x={11 + i * 6.2} y={12} width="3.6" height="40" rx="1.8" fill={c} opacity="0.85" />
          ))}
          <rect x="8" y="58" width="30" height="18" rx="1" fill="#151014" stroke="#8A6E37" strokeWidth="1" />
          {[0, 1, 2, 3, 4].map((i) => (
            <line key={i} x1={10 + i * 6} y1="60" x2={10 + i * 6} y2="74" stroke="#8A6E37" strokeWidth="0.8" opacity="0.6" />
          ))}
        </svg>
      </div>
    </div>
  )
}
