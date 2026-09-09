import { refreshApp } from '../refreshApp.js'

export default function SettingsScreen({
  volume,
  onVolumeChange,
  onClose,
  onSkipToBonusWheel,
  onSkipToBonusPlates,
  onSkipToBonusShaker,
  onSkipToNewVenue,
}) {
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center bg-ink/95 px-8 py-10 overflow-y-auto">
      <button
        onClick={onClose}
        aria-label="Close settings"
        className="absolute text-brass text-2xl leading-none hover:text-cream transition-colors"
        style={{ top: 'calc(env(safe-area-inset-top, 0px) + 14px)', right: 18, width: 36, height: 36 }}
      >
        &times;
      </button>

      <div className="font-display text-brass text-2xl mb-8 tracking-wide">SETTINGS</div>

      <div className="w-full max-w-xs mb-8">
        <label className="block text-cream/80 text-xs tracking-widest mb-2">MUSIC VOLUME</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={(e) => onVolumeChange(Number(e.target.value))}
          className="w-full accent-brass"
        />
      </div>

      <div className="w-full max-w-xs text-left mb-8">
        <div className="font-display text-brass text-sm tracking-widest mb-3">HOW TO PLAY</div>
        <ul className="text-cream/80 text-xs leading-relaxed space-y-2.5 list-disc list-inside">
          <li>Tap a lane to jump to it, or swipe up/down to move one at a time.</li>
          <li>Drag left or right to run along the counter.</li>
          <li>Tap the drink matching a patron's outfit color to pour it their way.</li>
          <li>Tap a returning glass or a hot dog to grab it, or just run over one.</li>
          <li>Don't let a patron reach the end of the bar — you'll lose a life and get sprayed.</li>
        </ul>
      </div>

      {onSkipToBonusWheel && (
        <button
          onClick={onSkipToBonusWheel}
          className="px-6 py-3 rounded-sm border border-brass text-brass tracking-widest text-sm hover:bg-brass hover:text-ink transition-colors mb-4"
        >
          SKIP TO ICE CREAM BONUS
        </button>
      )}

      {onSkipToBonusPlates && (
        <button
          onClick={onSkipToBonusPlates}
          className="px-6 py-3 rounded-sm border border-brass text-brass tracking-widest text-sm hover:bg-brass hover:text-ink transition-colors mb-4"
        >
          SKIP TO PLATE BONUS
        </button>
      )}

      {onSkipToBonusShaker && (
        <button
          onClick={onSkipToBonusShaker}
          className="px-6 py-3 rounded-sm border border-brass text-brass tracking-widest text-sm hover:bg-brass hover:text-ink transition-colors mb-4"
        >
          SKIP TO SHAKER BONUS
        </button>
      )}

      {/* Temporary dev shortcut for trying the stage-2+ soda-fountain
          venue reskin without clearing a bonus round first — remove once
          it's no longer needed for testing. */}
      {onSkipToNewVenue && (
        <button
          onClick={onSkipToNewVenue}
          className="px-6 py-3 rounded-sm border border-brass text-brass tracking-widest text-sm hover:bg-brass hover:text-ink transition-colors mb-4"
        >
          SKIP TO NEW VENUE
        </button>
      )}

      <button
        onClick={refreshApp}
        className="text-cream/50 text-xs tracking-[0.2em] underline underline-offset-4"
      >
        REFRESH APP
      </button>
    </div>
  )
}
