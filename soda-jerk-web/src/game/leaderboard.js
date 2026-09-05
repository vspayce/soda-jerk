// Local high scores — saved on this device only via localStorage, no
// backend. Classic arcade style: top 10, three-letter initials.
const STORAGE_KEY = 'soda-jerk-leaderboard'
const INITIALS_KEY = 'soda-jerk-initials'
export const MAX_ENTRIES = 10

export function getLeaderboard() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const list = raw ? JSON.parse(raw) : []
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

export function getLastInitials() {
  try {
    return localStorage.getItem(INITIALS_KEY) || ''
  } catch {
    return ''
  }
}

export function qualifiesForLeaderboard(score) {
  if (score <= 0) return false
  const list = getLeaderboard()
  if (list.length < MAX_ENTRIES) return true
  return score > list[list.length - 1].score
}

// Returns the updated (trimmed, sorted) list, plus the index the new
// entry landed at — -1 if it didn't make the cut after all.
export function addLeaderboardEntry(initials, score) {
  const clean = (initials || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3) || '???'
  const list = getLeaderboard()
  const entry = { initials: clean, score, date: Date.now() }
  list.push(entry)
  list.sort((a, b) => b.score - a.score)
  const trimmed = list.slice(0, MAX_ENTRIES)
  const index = trimmed.indexOf(entry)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
    localStorage.setItem(INITIALS_KEY, clean)
  } catch {
    // Private browsing / quota exceeded — the run's score just won't
    // persist past this session, nothing more to do about it here.
  }
  return { list: trimmed, index }
}
