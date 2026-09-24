// Levels — edit this file to retune pacing. Nothing else needs to change.
//
// A level is a set crowd. `crowd` is how many patrons each bar (top to
// bottom) gets; they walk in one at a time, and a patron shoved out the
// door is done. Clear the whole crowd — with no glass or drink still
// sliding — and the level's passed. Lose a life and the level starts over
// with its full crowd.
//
//   crowd       — patrons per bar, top to bottom
//   travelMs    — how long a patron takes to walk the whole bar (lower =
//                 less time to react)
//   entryMs     — time between patrons walking in (lower = busier)
//   drinkMs     — how long a served patron stands drinking before sliding
//                 the empty back
//   glassMs     — how long a returned empty takes to slide the whole bar
//
// Past the last row the game stays at that row's numbers for good.
export const LEVELS = [
  { crowd: [1, 1, 1, 1], travelMs: 15000, entryMs: 2400, drinkMs: 1700, glassMs: 4400 },
  { crowd: [2, 1, 2, 1], travelMs: 14000, entryMs: 2200, drinkMs: 1600, glassMs: 4200 },
  { crowd: [2, 2, 2, 2], travelMs: 13000, entryMs: 2000, drinkMs: 1500, glassMs: 4000 },
  { crowd: [2, 3, 2, 3], travelMs: 12000, entryMs: 1850, drinkMs: 1400, glassMs: 3800 },
  { crowd: [3, 3, 3, 3], travelMs: 11000, entryMs: 1700, drinkMs: 1300, glassMs: 3600 },
  { crowd: [3, 3, 3, 3], travelMs: 10000, entryMs: 1550, drinkMs: 1200, glassMs: 3400 },
  { crowd: [3, 4, 3, 4], travelMs: 9200, entryMs: 1400, drinkMs: 1100, glassMs: 3200 },
  { crowd: [4, 4, 4, 4], travelMs: 8500, entryMs: 1300, drinkMs: 1000, glassMs: 3000 },
  { crowd: [4, 4, 4, 4], travelMs: 7800, entryMs: 1200, drinkMs: 950, glassMs: 2800 },
  { crowd: [4, 4, 4, 4], travelMs: 7000, entryMs: 1100, drinkMs: 900, glassMs: 2600 },
  { crowd: [4, 4, 4, 4], travelMs: 6400, entryMs: 1000, drinkMs: 850, glassMs: 2500 },
  { crowd: [4, 4, 4, 4], travelMs: 5800, entryMs: 950, drinkMs: 800, glassMs: 2400 },
]

// Level numbers start at 1.
export function getLevel(level) {
  return LEVELS[Math.min(Math.max(1, level), LEVELS.length) - 1]
}
