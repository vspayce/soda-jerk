// Hand-drawn art-deco placeholder sprites. Flat, geometric, high-contrast
// shapes in the brass/emerald/garnet palette — meant to read clearly at
// small size and to be swapped for real illustrated/AI-generated art later
// (see BACKLOG.md). Keep the silhouettes simple if you replace these;
// legibility at ~36px matters more than detail.

export function PlayerSprite() {
  return (
    <svg viewBox="0 0 40 52" width="38" height="49">
      <ellipse cx="20" cy="49" rx="12" ry="2.5" fill="#000" opacity="0.35" />
      {/* apron */}
      <path d="M8 50 L10 27 Q20 21 30 27 L32 50 Z" fill="#EDE3D0" stroke="#151014" strokeWidth="1.4" />
      {/* vest */}
      <path d="M12.5 27 L16 50 L24 50 L27.5 27 Q20 23 12.5 27 Z" fill="#0E4B43" stroke="#151014" strokeWidth="1" />
      <circle cx="20" cy="33" r="1" fill="#C6A15B" />
      <circle cx="20" cy="39" r="1" fill="#C6A15B" />
      {/* bow tie */}
      <path d="M17 24.5 L20 27 L23 24.5 L23 21.5 L20 23.5 L17 21.5 Z" fill="#7A1F2B" />
      {/* head */}
      <circle cx="20" cy="15" r="6.5" fill="#D9B08C" stroke="#151014" strokeWidth="1.1" />
      {/* fedora */}
      <path d="M10.5 12.5 Q20 2.5 29.5 12.5 Q29.5 13.5 20 13.5 Q10.5 13.5 10.5 12.5 Z" fill="#151014" />
      <rect x="12" y="10.5" width="16" height="2.6" rx="1.3" fill="#C6A15B" />
    </svg>
  )
}

const CUSTOMER_VARIANTS = ['flapper', 'gent', 'flapper2', 'gent2']

export function CustomerSprite({ color, variantSeed = 0 }) {
  const variant = CUSTOMER_VARIANTS[Math.abs(variantSeed) % CUSTOMER_VARIANTS.length]
  const isFlapper = variant.startsWith('flapper')

  return (
    <svg viewBox="0 0 36 50" width="32" height="44">
      <ellipse cx="18" cy="47" rx="11" ry="2.3" fill="#000" opacity="0.3" />
      {/* body */}
      <path d="M9 46 L11 25 Q18 30.5 25 25 L27 46 Z" fill={color} stroke="#151014" strokeWidth="1.2" />

      {isFlapper ? (
        <>
          {/* drop-waist trim */}
          <path d="M11.5 34 L24.5 34" stroke="#151014" strokeWidth="1" opacity="0.4" />
          {/* head + cloche hat */}
          <circle cx="18" cy="14" r="6.2" fill="#D9B08C" stroke="#151014" strokeWidth="1" />
          <path d="M11.5 11.5 Q18 4 24.5 11.5 Q24.5 16.5 18 15.5 Q11.5 16.5 11.5 11.5 Z" fill="#151014" />
          <path d="M14 11 L22 11" stroke={color} strokeWidth="2" />
        </>
      ) : (
        <>
          {/* head + boater hat */}
          <circle cx="18" cy="14" r="6.2" fill="#D9B08C" stroke="#151014" strokeWidth="1" />
          <ellipse cx="18" cy="9.8" rx="8.5" ry="2" fill="#151014" />
          <rect x="13.2" y="6" width="9.6" height="4.6" rx="0.8" fill="#151014" />
          <rect x="13.2" y="8.5" width="9.6" height="1.2" fill={color} />
        </>
      )}
    </svg>
  )
}

// Small stylized soda mug used for both the outgoing mug and the
// returning empty-glass sprites.
export function MugGlyph({ empty = false }) {
  return (
    <svg viewBox="0 0 16 16" width="15" height="15">
      <path
        d="M4 3h6l-0.6 8.5a2.7 2.7 0 0 1-2.4 2.5 2.7 2.7 0 0 1-2.4-2.5L4 3z"
        fill={empty ? 'transparent' : '#EDE3D0'}
        stroke={empty ? '#7A1F2B' : '#151014'}
        strokeWidth="1.1"
      />
      <path d="M10 4.5h1.6a1.7 1.7 0 0 1 0 3.4H9.7" fill="none" stroke={empty ? '#7A1F2B' : '#151014'} strokeWidth="1" />
    </svg>
  )
}
