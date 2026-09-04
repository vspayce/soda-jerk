// Hand-drawn art-deco placeholder sprites. Flat, geometric, high-contrast
// shapes in the brass/emerald/garnet palette — meant to read clearly at
// small size and to be swapped for real illustrated/AI-generated art later
// (see BACKLOG.md). Keep the silhouettes simple if you replace these;
// legibility at ~36px matters more than detail.

// Matches the splash-screen portrait: white paper soda-jerk cap with a
// red crossed band, dark hair, white shirt, black suspenders over a
// red-and-white striped apron, maroon bow tie.
export function PlayerSprite() {
  return (
    <svg viewBox="0 0 40 52" width="38" height="49">
      <defs>
        <pattern id="apronStripes" width="4" height="4" patternUnits="userSpaceOnUse">
          <rect width="4" height="4" fill="#F4EEE2" />
          <rect width="2" height="4" fill="#8A3B2E" />
        </pattern>
      </defs>
      <ellipse cx="20" cy="49" rx="12" ry="2.5" fill="#000" opacity="0.35" />
      {/* shirt (shoulders/arms) */}
      <path d="M9 50 L11 26 Q20 21 29 26 L31 50 Z" fill="#F4EEE2" stroke="#151014" strokeWidth="1.2" />
      {/* black suspenders over the shoulders */}
      <path d="M14.5 27.5 L16 23.5" stroke="#151014" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M25.5 27.5 L24 23.5" stroke="#151014" strokeWidth="1.8" strokeLinecap="round" />
      {/* apron — vertical candy stripe */}
      <path d="M12.5 50 L14 29 Q20 25.5 26 29 L27.5 50 Z" fill="url(#apronStripes)" stroke="#151014" strokeWidth="1" />
      {/* bow tie */}
      <path d="M17 24.5 L20 27 L23 24.5 L23 21.5 L20 23.5 L17 21.5 Z" fill="#7A1F2B" />
      {/* head */}
      <circle cx="20" cy="15" r="6.5" fill="#D9A878" stroke="#151014" strokeWidth="1.1" />
      {/* dark hair */}
      <path d="M13.3 12.8 Q13.2 8 20 7.6 Q26.8 8 26.7 12.8 Q22 10.5 20 10.5 Q18 10.5 13.3 12.8Z" fill="#2B1B10" />
      {/* soda-jerk paper cap with crossed red band */}
      <path d="M11.8 11.3 Q20 3.8 28.2 11.3 L27 13.2 Q20 10.6 13 13.2 Z" fill="#F4EEE2" stroke="#151014" strokeWidth="1" />
      <path d="M12.5 12.2 L27.5 8.6 M12.5 8.6 L27.5 12.2" stroke="#7A1F2B" strokeWidth="1.1" />
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

// Swinging saloon door at the far end of the bar — where customers enter
// from. Two half-doors on brass hinges, framed in the doorway.
export function DoorGlyph() {
  return (
    <svg viewBox="0 0 32 46" width="30" height="43">
      <rect x="1.5" y="1.5" width="29" height="43" rx="2.5" fill="#0A0708" stroke="#C6A15B" strokeWidth="1.6" />
      <rect x="4" y="8" width="11" height="30" rx="1.2" fill="#7A1F2B" stroke="#151014" strokeWidth="1" transform="rotate(-7 9.5 23)" />
      <rect x="17" y="8" width="11" height="30" rx="1.2" fill="#7A1F2B" stroke="#151014" strokeWidth="1" transform="rotate(7 22.5 23)" />
      <circle cx="12.5" cy="23" r="1" fill="#C6A15B" />
      <circle cx="19.5" cy="23" r="1" fill="#C6A15B" />
    </svg>
  )
}

// Chrome-and-brass soda fountain spigot mounted at the counter — where
// mugs are filled from.
export function TapGlyph() {
  return (
    <svg viewBox="0 0 20 34" width="20" height="34">
      <rect x="7" y="0" width="6" height="22" rx="2" fill="#C6A15B" stroke="#151014" strokeWidth="1" />
      <circle cx="10" cy="4" r="1.8" fill="#8A6E37" />
      <path d="M13 10 h6 a2.2 2.2 0 0 1 0 4.4 h-3.5" fill="none" stroke="#C6A15B" strokeWidth="2.6" strokeLinecap="round" />
      <rect x="5" y="20" width="10" height="4" rx="1" fill="#8A6E37" stroke="#151014" strokeWidth="1" />
    </svg>
  )
}

// Bonus hot dog — drops on the counter now and then, grab it for points
// before it goes cold.
export function HotDogGlyph({ size = 30 }) {
  return (
    <svg viewBox="0 0 32 20" width={size} height={size * (20 / 32)}>
      {/* bun, top and bottom halves */}
      <path d="M2 10 Q2 3 16 3 Q30 3 30 10 Q30 12 27 12 L5 12 Q2 12 2 10Z" fill="#D9A868" stroke="#151014" strokeWidth="1" />
      <path d="M3 12 L29 12 Q29 17 16 17 Q3 17 3 12Z" fill="#C6935A" stroke="#151014" strokeWidth="1" />
      {/* sausage */}
      <rect x="5" y="7" width="22" height="6" rx="3" fill="#8A3B2E" stroke="#151014" strokeWidth="1" />
      {/* mustard squiggle */}
      <path d="M7 9.5 Q10 7.5 13 9.5 T19 9.5 T25 9.5" fill="none" stroke="#E8C878" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

// A literal hot dog — scurries across the counter as the little
// celebration for grabbing a bonus.
export function DachshundGlyph() {
  return (
    <svg viewBox="0 0 64 32" width="56" height="28">
      <ellipse cx="32" cy="29" rx="24" ry="2" fill="#000" opacity="0.3" />
      {/* legs */}
      <rect x="10" y="21" width="4" height="7" rx="2" fill="#5C3A21" />
      <rect x="22" y="21" width="4" height="7" rx="2" fill="#5C3A21" />
      <rect x="38" y="21" width="4" height="7" rx="2" fill="#5C3A21" />
      <rect x="50" y="21" width="4" height="7" rx="2" fill="#5C3A21" />
      {/* tail */}
      <path d="M6 15 Q0 11 2 7" stroke="#8A5A2E" strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* body */}
      <ellipse cx="32" cy="18" rx="26" ry="9" fill="#8A5A2E" stroke="#151014" strokeWidth="1.2" />
      {/* head */}
      <circle cx="56" cy="12" r="8" fill="#8A5A2E" stroke="#151014" strokeWidth="1.2" />
      {/* snout */}
      <ellipse cx="62" cy="14" rx="4" ry="3" fill="#6B4226" />
      {/* ear */}
      <path d="M52 8 Q46 12 50 20 Q54 18 54 10Z" fill="#5C3A21" stroke="#151014" strokeWidth="1" />
      {/* eye */}
      <circle cx="58" cy="10" r="1" fill="#151014" />
      {/* bow collar, matching the bartender's */}
      <path d="M50 16 L53 18 L56 16 L56 14 L53 15.5 L50 14 Z" fill="#7A1F2B" />
    </svg>
  )
}

// Small stylized soda mug used for both the outgoing mug (tinted by drink
// type) and the returning empty-glass sprite.
export function MugGlyph({ empty = false, size = 26, color = '#EDE3D0' }) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size}>
      <path
        d="M4 3h6l-0.6 8.5a2.7 2.7 0 0 1-2.4 2.5 2.7 2.7 0 0 1-2.4-2.5L4 3z"
        fill={empty ? 'transparent' : color}
        stroke={empty ? '#7A1F2B' : '#151014'}
        strokeWidth="1.1"
      />
      <path d="M10 4.5h1.6a1.7 1.7 0 0 1 0 3.4H9.7" fill="none" stroke={empty ? '#7A1F2B' : '#151014'} strokeWidth="1" />
    </svg>
  )
}

// Seltzer siphon spray — a fan of streams and droplets, briefly overlaid
// on the bartender's face when an unserved customer reaches the end of
// the bar in their lane.
export function SeltzerSprayGlyph() {
  return (
    <svg viewBox="0 0 40 30" width="52" height="39">
      <g stroke="#BFE3E0" strokeWidth="1.4" strokeLinecap="round" opacity="0.9">
        <path d="M40 4 L4 12" />
        <path d="M40 15 L2 15" />
        <path d="M40 26 L4 18" />
      </g>
      <circle cx="9" cy="9" r="1.5" fill="#E8F6F5" />
      <circle cx="6" cy="15" r="1.7" fill="#E8F6F5" />
      <circle cx="10" cy="21" r="1.3" fill="#E8F6F5" />
      <circle cx="17" cy="6" r="1" fill="#E8F6F5" />
      <circle cx="16" cy="24" r="1.1" fill="#E8F6F5" />
    </svg>
  )
}
