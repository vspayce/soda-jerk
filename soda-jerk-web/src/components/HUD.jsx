export default function HUD({ score, lives, isMuted, onToggleMute }) {
  return (
    <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 pt-3 pb-2">
      <div
        className="font-display text-cream text-lg tracking-wide pointer-events-none"
        style={{ textShadow: '0 2px 6px rgba(0,0,0,0.6)' }}
      >
        {score.toString().padStart(4, '0')}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex gap-1 pointer-events-none">
          {Array.from({ length: lives }).map((_, i) => (
            <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M6 3h12l-1.2 8.5a5 5 0 0 1-4.8 4.3v3.2h3v2H9v-2h3v-3.2a5 5 0 0 1-4.8-4.3L6 3z"
                fill="#C6A15B"
              />
            </svg>
          ))}
        </div>

        {onToggleMute && (
          <button
            onPointerDown={(e) => {
              e.preventDefault()
              onToggleMute()
            }}
            className="text-brass opacity-80 active:opacity-100"
            aria-label={isMuted ? 'Unmute music' : 'Mute music'}
          >
            {isMuted ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M3 9v6h4l5 4V5L7 9H3z" fill="currentColor" />
                <path d="M16 8l5 8M21 8l-5 8" stroke="currentColor" strokeWidth="1.8" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M3 9v6h4l5 4V5L7 9H3z" fill="currentColor" />
                <path
                  d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  fill="none"
                />
              </svg>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
