export default function LeaderboardList({ entries, highlightIndex = -1 }) {
  if (!entries || entries.length === 0) {
    return <div className="text-cream/50 text-sm py-4">No scores yet — be the first!</div>
  }

  return (
    <div className="w-full max-w-xs">
      {entries.map((e, i) => (
        <div
          key={i}
          className="flex items-center justify-between px-3 py-1.5 text-sm"
          style={{
            color: i === highlightIndex ? '#F0D998' : 'rgba(237,227,208,0.8)',
            fontWeight: i === highlightIndex ? 700 : 400,
          }}
        >
          <span className="font-display tracking-widest">
            {i + 1}. {e.initials || '???'}
          </span>
          <span className="tabular-nums">{e.score}</span>
        </div>
      ))}
    </div>
  )
}
