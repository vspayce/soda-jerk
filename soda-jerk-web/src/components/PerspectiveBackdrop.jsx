import { ART_SRC } from '../game/art.js'
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


// A repeating ogee/swirl damask, echoing the wallpaper behind the counter
// in the splash art — replaces the old straight brass fluting lines. The
// stroke color is baked in (data URIs can't take a CSS variable).
const SWIRL_PATTERN_SPEAKEASY =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Cpath d='M15 30c0-10 8-16 15-16s15 6 15 16-8 16-15 16-15-6-15-16z' stroke='%23EDE3D0' stroke-width='1' fill='none' opacity='0.6'/%3E%3Cpath d='M0 0c15 0 15 15 30 15s15-15 30-15M0 60c15 0 15-15 30-15s15 15 30 15' stroke='%23EDE3D0' stroke-width='1' fill='none' opacity='0.6'/%3E%3C/svg%3E"
// The speakeasy look is the original arcade-cabinet palette. The other
// venues (see venues.js) draw their own rooms further down.
const THEMES = {
  speakeasy: {
    wallGradient: 'linear-gradient(180deg, #8A6E37 0%, #151014 70%)',
    swirlPattern: SWIRL_PATTERN_SPEAKEASY,
    swirlPatternSize: 60,
    vanishingGlow: 'radial-gradient(ellipse at 50% 0%, rgba(232,200,120,0.28) 0%, transparent 70%)',
    sconceColor: '#E8C878',
    sconceGlow: '0 0 10px 3px rgba(232,200,120,0.55)',
    lightWedge: 'linear-gradient(115deg, transparent 35%, rgba(198,161,91,0.22) 48%, transparent 62%)',
    accent: '#C6A15B',
  },
}

// Corner flourish — a curling scroll, replacing the old geometric
// sunburst fan, to match the swirl filigree on the "SODA JERK" sign.
function CornerSwirl({ corner, color }) {
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
        stroke={color}
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="2" cy="2" r="2.2" fill={color} />
    </svg>
  )
}

export default function PerspectiveBackdrop({ venue = 'speakeasy' }) {
  if (venue === 'fountain') return <FountainBackdrop />
  if (venue === 'circus') return <CircusBackdrop />
  return <SpeakeasyBackdrop />
}

function SpeakeasyBackdrop() {
  const theme = THEMES.speakeasy
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
          background: theme.vanishingGlow,
        }}
      />

      {/* left wall panel, converging toward the vanishing point */}
      <div
        className="absolute inset-0"
        style={{
          clipPath: 'polygon(46% 0%, 50% 0%, 6% 100%, -6% 100%)',
          background: theme.wallGradient,
        }}
      />
      {/* left wall — swirl damask, same slant as the wall */}
      <div
        className="absolute inset-0 opacity-[0.14]"
        style={{
          clipPath: 'polygon(46% 0%, 50% 0%, 6% 100%, -6% 100%)',
          backgroundImage: `url("${theme.swirlPattern}")`,
          backgroundSize: `${theme.swirlPatternSize}px ${theme.swirlPatternSize}px`,
        }}
      />

      {/* right wall panel */}
      <div
        className="absolute inset-0"
        style={{
          clipPath: 'polygon(50% 0%, 54% 0%, 106% 100%, 94% 100%)',
          background: theme.wallGradient,
        }}
      />
      {/* right wall — swirl damask */}
      <div
        className="absolute inset-0 opacity-[0.14]"
        style={{
          clipPath: 'polygon(50% 0%, 54% 0%, 106% 100%, 94% 100%)',
          backgroundImage: `url("${theme.swirlPattern}")`,
          backgroundSize: `${theme.swirlPatternSize}px ${theme.swirlPatternSize}px`,
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
              background: theme.sconceColor,
              boxShadow: theme.sconceGlow,
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
          background: theme.lightWedge,
          mixBlendMode: 'screen',
        }}
      />

      {/* corner swirl flourishes, top and bottom */}
      <CornerSwirl corner="tl" color={theme.accent} />
      <CornerSwirl corner="tr" color={theme.accent} />
      <CornerSwirl corner="bl" color={theme.accent} />
      <CornerSwirl corner="br" color={theme.accent} />

      {/* stepped cove molding beneath the vanishing point, framing the sign */}
      <div className="absolute left-1/2 top-0 -translate-x-1/2 flex flex-col items-center">
        {[46, 34, 22].map((w, i) => (
          <div key={i} style={{ width: w, height: 3, marginTop: i === 0 ? 0 : 1, background: theme.accent, opacity: 0.5 - i * 0.1 }} />
        ))}
      </div>

      <Logo />

      {/* Mighty Wurlitzer, front and center up top — a gentle rhythmic
          sway plus a couple of stop-tab glints standing in for it being
          played, since there's no separate art for pressed keys/lit stops. */}
      <img
        src={ART_SRC('wurlitzer.png')}
        alt=""
        className="absolute left-1/2 opacity-95 organ-playing"
        style={{ top: '9%', width: '24%', height: 'auto' }}
      />
      <div className="absolute left-1/2 -translate-x-1/2 pointer-events-none" style={{ top: '9%', width: '24%' }}>
        <div className="organ-stop-glint absolute rounded-full" style={{ left: '22%', top: '61%', width: '4%', aspectRatio: '1/1', animationDelay: '0s' }} />
        <div className="organ-stop-glint absolute rounded-full" style={{ left: '58%', top: '58%', width: '4%', aspectRatio: '1/1', animationDelay: '0.5s' }} />
        <div className="organ-stop-glint absolute rounded-full" style={{ left: '40%', top: '64%', width: '4%', aspectRatio: '1/1', animationDelay: '1s' }} />
      </div>

    </div>
  )
}

// Overhead signage banner — the same logo lockup as the splash screen,
// sized to clear the lives icons in the HUD row. Every venue hangs it.
function Logo() {
  return (
    <img
      src={ART_SRC('soda-jerk-logo.png')}
      alt="Soda Jerk"
      className="absolute left-1/2 -translate-x-1/2"
      style={{ top: 'calc(env(safe-area-inset-top, 0px) + 44px)', height: 24, width: 'auto' }}
    />
  )
}

const LEFT_WALL = 'polygon(46% 0%, 50% 0%, 6% 100%, -6% 100%)'
const RIGHT_WALL = 'polygon(50% 0%, 54% 0%, 106% 100%, 94% 100%)'

// A floor running away toward the vanishing point, tiled with `pattern`
// (a CSS background) — tipped back in 3D so the tiles shrink with distance.
function PerspectiveFloor({ pattern, size, tint }) {
  return (
    <div className="absolute inset-x-0 bottom-0" style={{ top: '18%', perspective: 260, perspectiveOrigin: '50% 0%' }}>
      <div
        className="absolute"
        style={{
          left: '-150%',
          right: '-150%',
          top: 0,
          bottom: '-40%',
          background: pattern,
          backgroundSize: `${size}px ${size}px`,
          transform: 'rotateX(58deg)',
          transformOrigin: '50% 0%',
        }}
      />
      {/* fade into the dark at the far end */}
      <div className="absolute inset-0" style={{ background: tint }} />
    </div>
  )
}

// ---------------------------------------------------------------- Pop's
// A 1950s soda fountain: mint walls over white tile, a black-and-white
// checkerboard floor, and a pink neon sign where the speakeasy has its
// organ. Counters, glass doors and stools come from Lane.jsx.

const SUBWAY_TILE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='12'%3E%3Cpath d='M0 0.5h24M0 6.5h24M0.5 0v6M12.5 6v6' stroke='%23FFFFFF' stroke-width='1' fill='none'/%3E%3C/svg%3E"

function FountainBackdrop() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div className="absolute inset-0" style={{ background: '#0D1B1A' }} />
      <PerspectiveFloor
        pattern="conic-gradient(#CFC8BC 25%, #1E2624 0 50%, #CFC8BC 0 75%, #1E2624 0)"
        size={16}
        tint="linear-gradient(180deg, #0D1B1A 0%, rgba(13,27,26,0.85) 30%, rgba(13,27,26,0.55) 100%)"
      />
      <div
        className="absolute left-1/2 top-0 -translate-x-1/2"
        style={{ width: '80%', height: '45%', background: 'radial-gradient(ellipse at 50% 0%, rgba(255,170,205,0.35) 0%, transparent 70%)' }}
      />
      {[LEFT_WALL, RIGHT_WALL].map((clip) => (
        <div key={clip}>
          <div className="absolute inset-0" style={{ clipPath: clip, background: 'linear-gradient(180deg, #A9E0CF 0%, #5FA898 45%, #10201E 85%)' }} />
          {/* white subway tile on the lower wall, under a chrome rail */}
          <div
            className="absolute inset-0"
            style={{
              clipPath: clip,
              backgroundImage: `url("${SUBWAY_TILE}")`,
              backgroundSize: '24px 12px',
              opacity: 0.22,
              maskImage: 'linear-gradient(180deg, transparent 40%, black 46%)',
              WebkitMaskImage: 'linear-gradient(180deg, transparent 40%, black 46%)',
            }}
          />
        </div>
      ))}
      {/* chrome rail along each wall, at the top of the tile */}
      <div className="absolute inset-0" style={{ clipPath: 'polygon(28.6% 40%, 29.4% 40%, 27.4% 46%, 26.4% 46%)', background: '#E6EEF0' }} />
      <div className="absolute inset-0" style={{ clipPath: 'polygon(70.6% 40%, 71.4% 40%, 73.6% 46%, 72.6% 46%)', background: '#E6EEF0' }} />

      <Logo />

      {/* the neon sign, front and centre */}
      <div className="absolute left-1/2 -translate-x-1/2 text-center" style={{ top: '13%' }}>
        <div
          className="font-script neon-flicker"
          style={{
            fontSize: 30,
            lineHeight: 1,
            color: '#FFE3F1',
            textShadow: '0 0 4px #FF5FA8, 0 0 10px #FF5FA8, 0 0 22px #FF2E8A, 0 0 36px #FF2E8A',
            whiteSpace: 'nowrap',
          }}
        >
          Soda Fountain
        </div>
        <div
          className="font-display tracking-[0.3em]"
          style={{
            marginTop: 6,
            fontSize: 9,
            color: '#E6FFF7',
            textShadow: '0 0 4px #4FE3C1, 0 0 10px #22C9A2',
            whiteSpace: 'nowrap',
          }}
        >
          SODAS · SUNDAES · MALTS
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------- Big Top
// Inside a circus tent: red and cream canvas stripes running up to the
// pole at the top, bunting strung across, two spotlights sweeping, a
// sawdust floor and the venue's name in marquee bulbs.

function CircusBackdrop() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* the canvas: stripes radiating from the tent pole above the screen */}
      <div
        className="absolute inset-0"
        style={{
          background: 'repeating-conic-gradient(from 180deg at 50% -18%, #B3141B 0deg 5deg, #F1E3C6 5deg 10deg)',
        }}
      />
      {/* falling off into shadow toward the floor, and shaded up top so
          the scoreboard reads against the canvas */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(20,6,10,0.7) 0%, rgba(20,6,10,0.55) 11%, rgba(20,6,10,0.2) 16%, rgba(20,6,10,0.55) 35%, rgba(12,4,8,0.92) 70%)' }} />
      <PerspectiveFloor
        pattern="radial-gradient(circle at 30% 40%, rgba(120,72,30,0.35) 0 1px, transparent 2px), radial-gradient(circle at 70% 80%, rgba(255,230,170,0.25) 0 1px, transparent 2px), #8E6332"
        size={9}
        tint="linear-gradient(180deg, #14060A 0%, rgba(20,6,10,0.7) 30%, rgba(20,6,10,0.4) 100%)"
      />

      {/* spotlights sweeping from the top corners */}
      <div className="absolute spotlight spotlight-left" />
      <div className="absolute spotlight spotlight-right" />

      {/* bunting, swagged across the top */}
      <svg className="absolute left-0 w-full" style={{ top: 0, height: 30 }} viewBox="0 0 100 34" preserveAspectRatio="none">
        <path d="M0 2 Q50 18 100 2" stroke="#3B2A1A" strokeWidth="0.5" fill="none" />
        {Array.from({ length: 13 }).map((_, i) => {
          const x = 3 + i * 7.7
          const y = 2 + 16 * (1 - Math.pow((x - 50) / 50, 2)) * 0.95
          const fill = ['#F2B705', '#1E5AA8', '#D7263D', '#2E9E5B'][i % 4]
          return <path key={i} d={`M${x - 2.6} ${y} L${x + 2.6} ${y} L${x} ${y + 9} Z`} fill={fill} />
        })}
      </svg>

      <Logo />

      {/* the name in marquee bulbs */}
      <div className="absolute left-1/2 -translate-x-1/2 text-center" style={{ top: '12.5%' }}>
        <div
          className="relative font-display px-3 py-1"
          style={{
            fontSize: 22,
            letterSpacing: '0.12em',
            color: '#FFD447',
            textShadow: '0 2px 0 #7A1010, 0 0 12px rgba(255,200,80,0.6)',
            whiteSpace: 'nowrap',
            border: '2px solid #FFD447',
            borderRadius: 6,
            background: 'rgba(90,10,14,0.85)',
          }}
        >
          THE BIG TOP
          <div className="absolute inset-0 marquee-bulbs" />
        </div>
      </div>
    </div>
  )
}
