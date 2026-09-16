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
// The curve used to stop at level 6 / 2,500 points, which made everything
// past that play identically forever — and with an extra life every 10,000
// the game actually got EASIER the longer you lasted. It now keeps
// tightening out to 20,000, with the gaps between levels widening as they
// go, since a player scoring faster clears each threshold quicker.
export const LEVELS = [
  { level: 1, score: 0, spawnIntervalMs: 2200, customerTravelMs: 14702 },
  { level: 2, score: 500, spawnIntervalMs: 1900, customerTravelMs: 12294 },
  { level: 3, score: 1000, spawnIntervalMs: 1600, customerTravelMs: 10288 },
  { level: 4, score: 1500, spawnIntervalMs: 1350, customerTravelMs: 8531 },
  { level: 5, score: 2000, spawnIntervalMs: 1150, customerTravelMs: 7277 },
  { level: 6, score: 2500, spawnIntervalMs: 1000, customerTravelMs: 6371 },
  { level: 7, score: 3200, spawnIntervalMs: 920, customerTravelMs: 5750 },
  { level: 8, score: 4000, spawnIntervalMs: 850, customerTravelMs: 5250 },
  { level: 9, score: 5000, spawnIntervalMs: 790, customerTravelMs: 4800 },
  { level: 10, score: 6200, spawnIntervalMs: 740, customerTravelMs: 4420 },
  { level: 11, score: 7600, spawnIntervalMs: 700, customerTravelMs: 4100 },
  { level: 12, score: 9200, spawnIntervalMs: 665, customerTravelMs: 3830 },
  { level: 13, score: 11000, spawnIntervalMs: 635, customerTravelMs: 3610 },
  { level: 14, score: 13000, spawnIntervalMs: 610, customerTravelMs: 3430 },
  { level: 15, score: 15500, spawnIntervalMs: 590, customerTravelMs: 3290 },
  // The floor. Patrons still need long enough to be seen and served, and
  // stage 3 stretches this a further 45% anyway (STAGE_TRAVEL_MULTIPLIER).
  { level: 16, score: 20000, spawnIntervalMs: 575, customerTravelMs: 3200 },
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
