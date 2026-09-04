// Title screen shown before the game starts. Doubles as the required
// "real user gesture" moment that unlocks audio playback on mobile —
// see App.jsx, which calls music.start() from the same tap.
const SPLASH_SRC = `${import.meta.env.BASE_URL}art/splash.png`

export default function SplashScreen({ onStart }) {
  return (
    <div
      className="absolute inset-0 z-50 flex flex-col items-center justify-end select-none"
      style={{
        backgroundImage: `url(${SPLASH_SRC})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center 20%',
      }}
    >
      <div
        className="w-full pt-32 pb-12 flex flex-col items-center gap-1"
        style={{ background: 'linear-gradient(180deg, transparent 0%, rgba(21,16,20,0.75) 45%, #151014 100%)' }}
      >
        <div className="text-cream/70 text-xs tracking-[0.3em] mb-4">A PROHIBITION-ERA SODA COUNTER</div>
        <button
          onPointerDown={(e) => {
            e.preventDefault()
            onStart()
          }}
          className="px-9 py-3.5 rounded-sm border-2 border-brass text-brass font-display text-lg tracking-[0.2em] active:bg-brass active:text-ink transition-colors"
          style={{ animation: 'pulse-glow 1.8s ease-in-out infinite' }}
        >
          TAP TO START
        </button>
      </div>
    </div>
  )
}
