// Difficulty levels — edit this file to retune pacing. Nothing else
// needs to change.
//
// Levels are gated by SCORE, not by how long you've survived. The game
// is at level N once your score reaches that level's `score` threshold,
// and stays there until you reach the next one. Add, remove, or
// reorder levels freely — just keep `score` ascending — and the game
// will pick up any new/changed values immediately.
//
//   score            — points needed to reach this level
//   spawnIntervalMs  — time between new customers walking in (lower = busier)
//   customerTravelMs — time a customer takes to walk the full bar before
//                      reaching the end (lower = less time to react)
// customerTravelMs values are a further 20% slower on top of the prior
// pacing pass — patrons were still crossing the bar too briskly.
export const LEVELS = [
  { level: 1, score: 0, spawnIntervalMs: 2200, customerTravelMs: 14702 },
  { level: 2, score: 500, spawnIntervalMs: 1900, customerTravelMs: 12294 },
  { level: 3, score: 1000, spawnIntervalMs: 1600, customerTravelMs: 10288 },
  { level: 4, score: 1500, spawnIntervalMs: 1350, customerTravelMs: 8531 },
  { level: 5, score: 2000, spawnIntervalMs: 1150, customerTravelMs: 7277 },
  { level: 6, score: 2500, spawnIntervalMs: 1000, customerTravelMs: 6371 },
]

// The last level in the list is the difficulty ceiling — any score past
// its threshold just keeps using its numbers.
export function getLevelForScore(score) {
  let current = LEVELS[0]
  for (const lvl of LEVELS) {
    if (score >= lvl.score) current = lvl
    else break
  }
  return current
}
