import LeaderboardList from './LeaderboardList.jsx'
import { getLeaderboard } from '../game/leaderboard.js'

export default function LeaderboardScreen({ onClose }) {
  const entries = getLeaderboard()
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-ink/95 px-8 text-center">
      <div className="font-display text-brass text-2xl tracking-wide mb-6">HIGH SCORES</div>
      <LeaderboardList entries={entries} />
      <button
        onClick={onClose}
        className="mt-8 px-6 py-2.5 rounded-sm border border-brass text-brass tracking-widest text-sm hover:bg-brass hover:text-ink transition-colors"
      >
        BACK
      </button>
    </div>
  )
}
