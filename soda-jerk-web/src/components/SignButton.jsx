// A button styled like the "SODA JERK" sign itself — cream background,
// black frame, deep red script text with flanking swirl flourishes.
function Swirl({ flip }) {
  return (
    <svg
      width="30"
      height="16"
      viewBox="0 0 30 16"
      fill="none"
      style={{ transform: flip ? 'scaleX(-1)' : 'none', opacity: 0.85, flexShrink: 0 }}
    >
      <path
        d="M2 8c0-4.5 6.5-6.5 9.5-3 2.5 3 0 5.5-2.5 4-1.5-1-1-2.5.5-2.5"
        stroke="#9B2E1A"
        strokeWidth="1.3"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="15" cy="8" r="1.3" fill="#9B2E1A" />
    </svg>
  )
}

export default function SignButton({ children, onPress }) {
  return (
    <button
      onPointerDown={(e) => {
        e.preventDefault()
        onPress()
      }}
      className="relative flex items-center gap-2 px-8 py-3 active:scale-95 transition-transform"
      style={{
        background: 'linear-gradient(180deg, #FCE4C4 0%, #EFCE9E 100%)',
        border: '3px solid #151014',
        borderRadius: 4,
        boxShadow: 'inset 0 0 0 2px rgba(21,16,20,0.18), 0 4px 14px rgba(0,0,0,0.5)',
      }}
    >
      <Swirl />
      <span className="font-script text-3xl tracking-wide" style={{ color: '#9B2E1A' }}>
        {children}
      </span>
      <Swirl flip />
    </button>
  )
}
