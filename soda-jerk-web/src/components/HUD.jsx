const PLAYER_HEAD_SRC = `${import.meta.env.BASE_URL}art/player-head.png`

export default function HUD({ score, lives, isMuted, onToggleMute, onOpenSettings }) {
  return (
    <div
      className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 pb-2"
      style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 44px)' }}
    >
      <div
        className="font-display text-cream text-lg tracking-wide pointer-events-none"
        style={{ textShadow: '0 2px 6px rgba(0,0,0,0.6)' }}
      >
        {score.toString().padStart(4, '0')}
      </div>

      <div className="flex items-center gap-3">
        <div
          className="flex items-center gap-1.5 pointer-events-none rounded-full px-2.5 py-1 border"
          style={{
            background: 'rgba(21,16,20,0.55)',
            borderColor: lives <= 2 ? '#7A1F2B' : 'rgba(198,161,91,0.5)',
          }}
        >
          <img
            src={PLAYER_HEAD_SRC}
            alt=""
            style={{ height: 22, width: 'auto', borderRadius: '50%' }}
          />
          <span
            className="font-display text-lg tracking-wide"
            style={{ color: lives <= 2 ? '#E0596B' : '#C6A15B' }}
          >
            ×{lives}
          </span>
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

        {onOpenSettings && (
          <button
            onPointerDown={(e) => {
              e.preventDefault()
              onOpenSettings()
            }}
            className="text-brass opacity-80 active:opacity-100"
            aria-label="Settings"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
