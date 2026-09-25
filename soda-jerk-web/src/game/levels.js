// Levels — edit this file to retune pacing. Nothing else needs to change.
//
// A level is a set crowd. `crowd` is how many patrons each bar (top to
// bottom) gets; the first two of each are already at the bar when the level
// opens (STARTING_PER_BAR), the rest walk in one at a time. A patron shoved
// out the door comes back in after `reenterMs` — but get the bar clear of
// the whole crowd at once (nothing still sliding) and the level's passed,
// whoever was on their way back. Lose a life and the level starts over.
//
//   crowd       — patrons per bar, top to bottom
//   travelMs    — how long a patron takes to walk the whole bar (lower =
//                 less time to react)
//   entryMs     — time between patrons walking in (lower = busier)
//   drinkMs     — how long a served patron stands drinking before sliding
//                 the empty back
//   glassMs     — how long a returned empty takes to slide the whole bar
//   reenterMs   — how long a patron shoved out the door stays out
//   reversed    — per bar, 1 = flipped: tap on the right, door on the left
//
// Past the last row the game stays at that row's numbers for good.
export const LEVELS = [
  { crowd: [2, 2, 2, 2], travelMs: 11000, entryMs: 1800, drinkMs: 1400, glassMs: 3800, reenterMs: 4200, reversed: [0, 0, 0, 0] },
  { crowd: [2, 3, 2, 3], travelMs: 10000, entryMs: 1650, drinkMs: 1300, glassMs: 3600, reenterMs: 4000, reversed: [0, 0, 0, 0] },
  { crowd: [3, 3, 3, 3], travelMs: 9200, entryMs: 1500, drinkMs: 1200, glassMs: 3400, reenterMs: 3800, reversed: [0, 1, 0, 1] },
  { crowd: [3, 4, 3, 4], travelMs: 8500, entryMs: 1350, drinkMs: 1100, glassMs: 3200, reenterMs: 3600, reversed: [1, 0, 1, 0] },
  { crowd: [4, 4, 4, 4], travelMs: 7800, entryMs: 1250, drinkMs: 1000, glassMs: 3000, reenterMs: 3400, reversed: [1, 1, 1, 1] },
  { crowd: [4, 5, 4, 5], travelMs: 7200, entryMs: 1150, drinkMs: 950, glassMs: 2800, reenterMs: 3200, reversed: [0, 1, 1, 0] },
  { crowd: [5, 5, 5, 5], travelMs: 6600, entryMs: 1050, drinkMs: 900, glassMs: 2600, reenterMs: 3000, reversed: [1, 0, 0, 1] },
  { crowd: [5, 6, 5, 6], travelMs: 6100, entryMs: 950, drinkMs: 850, glassMs: 2500, reenterMs: 2800, reversed: [0, 1, 0, 1] },
  { crowd: [6, 6, 6, 6], travelMs: 5600, entryMs: 900, drinkMs: 800, glassMs: 2400, reenterMs: 2700, reversed: [1, 1, 0, 0] },
  { crowd: [6, 6, 6, 6], travelMs: 5200, entryMs: 850, drinkMs: 750, glassMs: 2300, reenterMs: 2600, reversed: [0, 0, 1, 1] },
  { crowd: [6, 6, 6, 6], travelMs: 4800, entryMs: 800, drinkMs: 700, glassMs: 2200, reenterMs: 2500, reversed: [1, 0, 1, 0] },
  { crowd: [6, 6, 6, 6], travelMs: 4400, entryMs: 750, drinkMs: 650, glassMs: 2100, reenterMs: 2400, reversed: [0, 1, 1, 0] },
]

// Level numbers start at 1.
export function getLevel(level) {
  return LEVELS[Math.min(Math.max(1, level), LEVELS.length) - 1]
}
