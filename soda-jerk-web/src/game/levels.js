// Levels — edit this file to retune pacing. Nothing else needs to change.
//
// A level is a set crowd. `crowd` is how many patrons each bar (top to
// bottom) gets; they walk in one at a time, and a patron shoved off the far
// end comes back in after `reenterMs`. The level is passed the moment every
// one of them has come in and the bar is empty — everybody out the door at
// once, with no glass or drink still sliding. Lose a life and the level
// starts over with its full crowd.
//
//   crowd       — patrons per bar, top to bottom
//   travelMs    — how long a patron takes to walk the whole bar (lower =
//                 less time to react)
//   entryMs     — time between patrons walking in (lower = busier)
//   drinkMs     — how long a served patron stands drinking before sliding
//                 the empty back
//   reenterMs   — how long a patron shoved out the door stays out. The
//                 level's passed when everyone's out at once, so this is
//                 the window you have to get the last of them out in.
//   glassMs     — how long a returned empty takes to slide the whole bar
//
// Past the last row the game stays at that row's numbers for good.
export const LEVELS = [
  { crowd: [1, 1, 1, 1], travelMs: 15000, entryMs: 2400, drinkMs: 1700, reenterMs: 5000, glassMs: 4400 },
  { crowd: [2, 1, 2, 1], travelMs: 14000, entryMs: 2200, drinkMs: 1600, reenterMs: 4600, glassMs: 4200 },
  { crowd: [2, 2, 2, 2], travelMs: 13000, entryMs: 2000, drinkMs: 1500, reenterMs: 4200, glassMs: 4000 },
  { crowd: [2, 3, 2, 3], travelMs: 12000, entryMs: 1850, drinkMs: 1400, reenterMs: 3800, glassMs: 3800 },
  { crowd: [3, 3, 3, 3], travelMs: 11000, entryMs: 1700, drinkMs: 1300, reenterMs: 3500, glassMs: 3600 },
  { crowd: [3, 3, 3, 3], travelMs: 10000, entryMs: 1550, drinkMs: 1200, reenterMs: 3200, glassMs: 3400 },
  { crowd: [3, 3, 3, 3], travelMs: 9200, entryMs: 1400, drinkMs: 1100, reenterMs: 3000, glassMs: 3200 },
  { crowd: [3, 3, 3, 3], travelMs: 8500, entryMs: 1300, drinkMs: 1000, reenterMs: 2800, glassMs: 3000 },
  { crowd: [3, 3, 3, 3], travelMs: 7800, entryMs: 1200, drinkMs: 950, reenterMs: 2700, glassMs: 2800 },
  { crowd: [3, 3, 3, 3], travelMs: 7000, entryMs: 1100, drinkMs: 900, reenterMs: 2600, glassMs: 2600 },
  { crowd: [3, 3, 3, 3], travelMs: 6400, entryMs: 1000, drinkMs: 850, reenterMs: 2500, glassMs: 2500 },
  { crowd: [3, 3, 3, 3], travelMs: 5800, entryMs: 950, drinkMs: 800, reenterMs: 2400, glassMs: 2400 },
]

// Level numbers start at 1.
export function getLevel(level) {
  return LEVELS[Math.min(Math.max(1, level), LEVELS.length) - 1]
}
