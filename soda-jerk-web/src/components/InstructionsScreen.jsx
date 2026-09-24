import { POINTS_PER_SERVE, POINTS_PER_CAUGHT_GLASS, POINTS_PER_BONUS } from '../game/constants.js'
import SignButton from './SignButton.jsx'
import { ART_SRC } from '../game/art.js'


const ROWS = [
  {
    label: 'Serve a customer their drink',
    points: POINTS_PER_SERVE,
    icons: [ART_SRC('drink-orange.png'), ART_SRC('drink-pink.png')],
  },
  {
    label: 'Catch a returning glass',
    points: POINTS_PER_CAUGHT_GLASS,
    icons: [ART_SRC('glass-empty.png')],
    // Twinkles like the returning glass does in the lane.
    glint: true,
  },
  {
    label: 'Grab a hot dog',
    points: POINTS_PER_BONUS,
    icons: [ART_SRC('hotdog.png')],
  },
]

export default function InstructionsScreen({ onContinue, onShowLingo }) {
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-ink/95 px-8 text-center overflow-y-auto py-8">
      <div className="font-display text-brass text-2xl mb-2 tracking-wide">HOW TO SCORE</div>
      <div className="text-cream/50 text-xs tracking-[0.2em] mb-6">TAP A DRINK FOR A GLASS SLIDE — MATCH THEIR OUTFIT</div>

      <div className="w-full max-w-xs mb-6">
        {ROWS.map(({ label, points, icons, glint }, i) => (
          <div
            key={label}
            className="flex items-center justify-between py-3 gap-3"
            style={{ borderBottom: i < ROWS.length - 1 ? '1px solid rgba(198,161,91,0.2)' : 'none' }}
          >
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center gap-1" style={{ width: 52 }}>
                {icons.map((src) => (
                  <img
                    key={src}
                    src={src}
                    alt=""
                    className="relative"
                    style={{ height: 30, width: 'auto', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.6))' }}
                  />
                ))}
                {/* The same twinkle the returning glass has in the lane —
                    two out-of-sync glints (see Lane.jsx), so the thing
                    you're told to look for here looks like the thing you
                    then have to spot mid-game. */}
                {glint && (
                  <>
                    <div className="glass-glint absolute" style={{ top: '22%', left: '36%' }} />
                    <div
                      className="glass-glint absolute"
                      style={{ top: '58%', left: '58%', width: 6, height: 6, animationDelay: '0.4s' }}
                    />
                  </>
                )}
              </div>
              <span className="text-cream/80 text-sm text-left">{label}</span>
            </div>
            <span className="font-display text-brass text-xl whitespace-nowrap">+{points}</span>
          </div>
        ))}
      </div>

      <div
        className="w-full max-w-xs mb-8 flex items-center gap-3 text-left"
        style={{ background: 'rgba(198,161,91,0.08)', border: '1px solid rgba(198,161,91,0.25)', borderRadius: 6, padding: '10px 12px' }}
      >
        <div className="flex items-end flex-shrink-0" style={{ gap: 4 }}>
          <img src={ART_SRC('patron-orange.png')} alt="" style={{ height: 44, width: 'auto' }} />
          <img src={ART_SRC('patron2-orange.png')} alt="" style={{ height: 38, width: 'auto' }} />
        </div>
        <div className="text-cream/80 text-xs leading-snug">
          A drink <span className="text-brass font-display">knocks them back</span> down the bar. Knock them out the
          door and they're done; otherwise they stop to drink, slide the empty back to you, and come on again. A
          parent with their kid is heavier and moves less per drink. Clear the whole crowd out to pass the
          level. Grab a hot dog and the dachshund puts on a show — anyone watching it won't take a drink.
        </div>
      </div>

      <SignButton onPress={onContinue}>Let's Go</SignButton>

      {/* The game talks in trade slang — "Glass Slide", "In the Hay",
          "Glob" — so the glossary is reachable from the first screen that
          uses any of it, not only from the settings menu mid-game. */}
      {onShowLingo && (
        <button
          onClick={onShowLingo}
          className="mt-5 text-cream/50 text-xs tracking-[0.25em] underline underline-offset-4"
        >
          SODA JERK LINGO
        </button>
      )}
    </div>
  )
}
