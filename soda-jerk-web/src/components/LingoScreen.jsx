import { JERK_LINGO } from '../game/constants.js'

// The real counter slang a 1950s soda jerk called back to the fountain.
// It's where the game's own drink names come from ("In the Hay" is a
// strawberry milkshake), what the shaker round shouts on a hit, and what
// the game-over screen is calling you when it says "Pop Boy".
export default function LingoScreen({ onClose }) {
  return (
    // Opaque and above the settings panel it opens from — a translucent
    // layer at the same depth let the settings text bleed through and
    // made the glossary hard to read.
    <div className="absolute inset-0 z-[60] flex flex-col items-center bg-ink px-8 py-10 overflow-y-auto">
      <button
        onClick={onClose}
        aria-label="Close lingo"
        className="absolute text-brass text-2xl leading-none hover:text-cream transition-colors"
        style={{ top: 'calc(env(safe-area-inset-top, 0px) + 14px)', right: 18, width: 36, height: 36 }}
      >
        &times;
      </button>

      <div className="font-display text-brass text-2xl mb-2 tracking-wide text-center">SODA JERK LINGO</div>
      <div className="text-cream/60 text-[11px] tracking-[0.2em] mb-8 text-center">
        WHAT THEY HOLLERED BEHIND THE COUNTER
      </div>

      <dl className="w-full max-w-sm text-left space-y-3 mb-8">
        {JERK_LINGO.map(({ term, def }) => (
          <div key={term} className="border-b border-cream/10 pb-2.5">
            <dt className="font-display text-brass text-sm tracking-wide">{term}</dt>
            <dd className="text-cream/75 text-xs leading-relaxed mt-0.5">{def}</dd>
          </div>
        ))}
      </dl>

      <button
        onClick={onClose}
        className="text-brass text-sm tracking-[0.2em] underline underline-offset-4 hover:text-cream transition-colors"
      >
        BACK
      </button>
    </div>
  )
}
