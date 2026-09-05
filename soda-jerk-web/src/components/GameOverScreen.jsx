import { useState } from 'react'
import { qualifiesForLeaderboard, addLeaderboardEntry, getLeaderboard, getLastInitials } from '../game/leaderboard.js'
import LeaderboardList from './LeaderboardList.jsx'

const FIRED_SRC = `${import.meta.env.BASE_URL}art/fired.png`

export default function GameOverScreen({ score, onRestart }) {
  const [qualifies] = useState(() => qualifiesForLeaderboard(score))
  const [saved, setSaved] = useState(false)
  const [initials, setInitials] = useState(getLastInitials())
  const [board, setBoard] = useState(() => getLeaderboard())
  const [highlightIndex, setHighlightIndex] = useState(-1)

  const showBoard = saved || !qualifies

  const handleSave = () => {
    const { list, index } = addLeaderboardEntry(initials, score)
    setBoard(list)
    setHighlightIndex(index)
    setSaved(true)
  }

  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-ink/90 px-8 text-center overflow-y-auto py-10">
      <div className="font-display text-brass text-3xl mb-2 tracking-wide">GAME OVER, YOU'RE FIRED!</div>
      <img src={FIRED_SRC} alt="" className="mb-2" style={{ height: 180, width: 'auto' }} />
      <div className="text-cream/80 mb-2">Final score</div>
      <div className="font-display text-cream text-5xl mb-6">{score}</div>

      {!showBoard && (
        <div className="mb-6 flex flex-col items-center gap-3">
          <div className="text-brass text-xs tracking-[0.25em]">NEW HIGH SCORE — ENTER YOUR INITIALS</div>
          <input
            value={initials}
            onChange={(e) => setInitials(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3))}
            maxLength={3}
            autoFocus
            className="w-24 text-center font-display text-2xl tracking-[0.3em] bg-transparent border-b-2 border-brass text-cream outline-none"
            style={{ caretColor: '#C6A15B' }}
          />
          <button
            onClick={handleSave}
            className="px-6 py-2 rounded-sm border border-brass text-brass tracking-widest text-sm hover:bg-brass hover:text-ink transition-colors"
          >
            SAVE SCORE
          </button>
        </div>
      )}

      {showBoard && (
        <div className="mb-6 w-full flex flex-col items-center">
          <div className="text-brass text-xs tracking-[0.3em] mb-2">HIGH SCORES</div>
          <LeaderboardList entries={board} highlightIndex={highlightIndex} />
        </div>
      )}

      <button
        onClick={onRestart}
        className="px-6 py-3 rounded-sm border border-brass text-brass tracking-widest text-sm hover:bg-brass hover:text-ink transition-colors"
      >
        TAP TO REOPEN
      </button>
    </div>
  )
}
