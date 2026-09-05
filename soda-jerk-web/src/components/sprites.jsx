// Hand-drawn placeholder shapes for pieces that don't have real
// illustrated art yet. Everything else has been swapped for actual
// artwork (see public/art) — keep these simple if you replace them too;
// legibility at ~30px matters more than detail.

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

// A literal hot dog — pops up and dances as the little celebration for
// grabbing a bonus.
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
