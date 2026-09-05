// Shared art-deco sign treatment — the same look as the "SODA JERK" logo
// up top: a dark panel, a double brass border, and corner sunbursts (the
// same conic-gradient trick as the hallway backdrop's corner fans) and a
// gold-gradient embossed title, instead of a plain bordered button.
function CornerFan({ corner, size = 34 }) {
  const pos = {
    tl: { top: 0, left: 0 },
    tr: { top: 0, right: 0 },
    bl: { bottom: 0, left: 0 },
    br: { bottom: 0, right: 0 },
  }[corner]
  return (
    <div
      className="absolute opacity-40"
      style={{
        ...pos,
        width: size,
        height: size,
        background: `repeating-conic-gradient(from 0deg at ${corner.includes('l') ? '0' : '100%'} ${corner.includes('t') ? '0' : '100%'}, #C6A15B 0deg 3deg, transparent 3deg 9deg)`,
      }}
    />
  )
}

// Small curling flourish flanking the title, mirrored on the right —
// the same kind of scrollwork framing the "SODA JERK" sign's lettering.
function Swirl({ flip }) {
  return (
    <svg
      width="30"
      height="16"
      viewBox="0 0 30 16"
      fill="none"
      style={{ transform: flip ? 'scaleX(-1)' : 'none', opacity: 0.75, flexShrink: 0 }}
    >
      <path
        d="M2 8c0-4.5 6.5-6.5 9.5-3 2.5 3 0 5.5-2.5 4-1.5-1-1-2.5.5-2.5"
        stroke="#C6A15B"
        strokeWidth="1.3"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="15" cy="8" r="1.3" fill="#C6A15B" />
    </svg>
  )
}

export default function DecoButton({
  children,
  subtext,
  onPress,
  className = '',
  titleClassName = 'text-4xl',
  pad = 'px-10 py-7',
  fanSize = 34,
}) {
  return (
    <button
      onPointerDown={(e) => {
        e.preventDefault()
        onPress()
      }}
      className={`relative ${pad} ${className}`}
      style={{
        background: '#151014',
        border: '2px solid #C6A15B',
        animation: 'pulse-glow 1.8s ease-in-out infinite',
      }}
    >
      <div className="absolute inset-[5px] pointer-events-none" style={{ border: '1px solid rgba(198,161,91,0.45)' }} />
      <CornerFan corner="tl" size={fanSize} />
      <CornerFan corner="tr" size={fanSize} />
      <CornerFan corner="bl" size={fanSize} />
      <CornerFan corner="br" size={fanSize} />

      <div className="flex items-center justify-center gap-2">
        <Swirl />
        <div
          className={`font-display ${titleClassName} tracking-[0.15em] whitespace-nowrap`}
          style={{
            backgroundImage: 'linear-gradient(180deg, #F0D998 0%, #C6A15B 45%, #8A6E37 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            textShadow: '0 2px 3px rgba(0,0,0,0.5)',
          }}
        >
          {children}
        </div>
        <Swirl flip />
      </div>

      {subtext && <div className="text-cream/60 text-[11px] tracking-[0.25em] mt-3">{subtext}</div>}
    </button>
  )
}
