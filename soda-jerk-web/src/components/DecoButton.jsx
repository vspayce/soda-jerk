// Shared art-deco sign treatment — the same look as the "SODA JERK" logo
// up top: a dark panel, a double brass border, and corner sunbursts (the
// same conic-gradient trick as the hallway backdrop's corner fans) and a
// gold-gradient embossed title, instead of a plain bordered button.
function CornerFan({ corner }) {
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
        width: 34,
        height: 34,
        background: `repeating-conic-gradient(from 0deg at ${corner.includes('l') ? '0' : '100%'} ${corner.includes('t') ? '0' : '100%'}, #C6A15B 0deg 3deg, transparent 3deg 9deg)`,
      }}
    />
  )
}

export default function DecoButton({ children, subtext, onPress, className = '', titleClassName = 'text-4xl', pad = 'px-10 py-7' }) {
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
      <CornerFan corner="tl" />
      <CornerFan corner="tr" />
      <CornerFan corner="bl" />
      <CornerFan corner="br" />

      <div
        className={`font-display ${titleClassName} tracking-[0.15em]`}
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

      {subtext && <div className="text-cream/60 text-[11px] tracking-[0.25em] mt-3">{subtext}</div>}
    </button>
  )
}
