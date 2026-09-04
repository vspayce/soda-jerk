export default function GameOverScreen({ score, onRestart }) {
  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-ink/90 px-8 text-center">
      <div className="font-display text-brass text-3xl mb-2 tracking-wide">THE FOUNTAIN IS CLOSED</div>
      <div className="text-cream/80 mb-8">Final score</div>
      <div className="font-display text-cream text-5xl mb-10">{score}</div>
      <button
        onClick={onRestart}
        className="px-6 py-3 rounded-sm border border-brass text-brass tracking-widest text-sm hover:bg-brass hover:text-ink transition-colors"
      >
        TAP TO REOPEN
      </button>
    </div>
  )
}
