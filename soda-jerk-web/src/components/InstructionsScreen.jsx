import { POINTS_PER_SERVE, POINTS_PER_CAUGHT_GLASS, POINTS_PER_BONUS } from '../game/constants.js'
import SignButton from './SignButton.jsx'

const ART_SRC = (name) => `${import.meta.env.BASE_URL}art/${name}`

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
    // The glass art is a nearly-white, mostly-transparent outline — same
    // problem as in the lane itself, so it gets the same glow treatment
    // to actually be visible here.
    glow: true,
  },
  {
    label: 'Grab a hot dog',
    points: POINTS_PER_BONUS,
    icons: [ART_SRC('hotdog.png')],
  },
]

export default function InstructionsScreen({ onContinue }) {
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-ink/95 px-8 text-center overflow-y-auto py-8">
      <div className="font-display text-brass text-2xl mb-2 tracking-wide">HOW TO SCORE</div>
      <div className="text-cream/50 text-xs tracking-[0.2em] mb-6">TAP A DRINK TO POUR IT — MATCH THEIR OUTFIT</div>

      <div className="w-full max-w-xs mb-6">
        {ROWS.map(({ label, points, icons, glow }, i) => (
          <div
            key={label}
            className="flex items-center justify-between py-3 gap-3"
            style={{ borderBottom: i < ROWS.length - 1 ? '1px solid rgba(198,161,91,0.2)' : 'none' }}
          >
            <div className="flex items-center gap-3">
              <div className="relative flex items-center gap-1" style={{ width: 52 }}>
                {glow && (
                  <div
                    className="absolute"
                    style={{
                      left: '50%',
                      top: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: 'radial-gradient(circle, rgba(255,221,140,0.85) 0%, rgba(255,221,140,0) 70%)',
                    }}
                  />
                )}
                {icons.map((src) => (
                  <img
                    key={src}
                    src={src}
                    alt=""
                    className="relative"
                    style={{ height: 30, width: 'auto', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.6))' }}
                  />
                ))}
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
          Solo customers need <span className="text-brass font-display">1 drink</span>. A parent with their kid needs{' '}
          <span className="text-brass font-display">2 drinks</span> — same flavor, twice — before they'll leave, and
          they keep walking the whole time, so don't dawdle.
        </div>
      </div>

      <SignButton onPress={onContinue}>Let's Go</SignButton>
    </div>
  )
}
