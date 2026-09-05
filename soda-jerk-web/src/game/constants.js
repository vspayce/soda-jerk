// All tunable numbers live here so balancing doesn't require hunting
// through game logic. Positions are percentages (0-100) along a lane.

export const LANE_COUNT = 4
export const STARTING_LIVES = 5

// x-position (%) of the bartender's home spot at the near end of the
// counter, and how far right they can run along it (left/right controls),
// at what speed (%/s).
export const PLAYER_X = 12
export const PLAYER_MAX_X = 85
export const PLAYER_RUN_SPEED_X = 70

// If an unserved customer's x reaches this point, they've made it all
// the way down the bar — lose a life. They never stop and never turn
// back; the only way to stop them is to serve them first.
export const END_OF_BAR_X = PLAYER_X + 4

export const OFFSCREEN_X = 108

// Visual-only: height (px) of the counter graphic in Lane.jsx. Characters
// anchor their feet to its bottom edge (so heads clear the top); mugs and
// glasses ride along its top edge (so they read as sliding on the surface,
// not passing through the middle of it).
export const COUNTER_HEIGHT_PX = 44

// Time (ms) for a mug to cross the full bar length if nothing's in the way.
export const MUG_TRAVEL_MS = 800
// 30% slower than the original 1800ms crossing time.
export const GLASS_RETURN_TRAVEL_MS = 2571

// Time (ms) for a served (happy) customer to walk off after being served.
export const CUSTOMER_WALK_OUT_MS = 900

// How long, at the very start vs. at max difficulty, an unserved
// customer takes to walk the full bar length before reaching the end.
// A third 20% cut on top of the previous two (~49% slower overall than
// the original 6000/2600ms).
export const CUSTOMER_TRAVEL_MS_START = 11719
export const CUSTOMER_TRAVEL_MS_MIN = 5079

// Spawn interval (ms) between new customers, decreases as difficulty ramps.
export const SPAWN_INTERVAL_START_MS = 2200
export const SPAWN_INTERVAL_MIN_MS = 1000

// Difficulty ramps continuously with survival time (endless mode, no
// discrete waves). RAMP_SECONDS is how long it takes to reach max
// difficulty — gentle start, steady climb.
export const RAMP_SECONDS = 90

export const GLASS_RETURN_CHANCE = 0.35

// How long the bartender stays at the end of the bar getting sprayed
// before the "YOU DIED" pause kicks in.
export const SPRAY_HOLD_MS = 2000

// How close (in x) the bartender has to run to a returning glass to
// auto-grab it just by being there, same as tapping it directly.
export const GLASS_REACH_X = 10

export const POINTS_PER_SERVE = 100
export const POINTS_PER_CAUGHT_GLASS = 25

// Selectable drink types — pick one with the selector between the
// joystick and the JERK button before pouring. A customer's outfit color
// shows which one they want; the wrong drink just sails past them
// uncaught, same as throwing with no one there — it has to match to
// serve them.
export const DRINK_TYPES = [
  { name: 'Orange Creme', color: '#D9822B', icon: 'drink-orange.png' },
  { name: 'In the Hay', color: '#D9668A', icon: 'drink-pink.png' },
]

// A hot dog drops on the counter every so often, somewhere within the
// bartender's run range — reach it (JERK while close enough) before it
// goes cold for a bonus. Purely optional: ignoring one costs nothing.
export const BONUS_SPAWN_INTERVAL_MIN_MS = 9000
export const BONUS_SPAWN_INTERVAL_MAX_MS = 18000
export const BONUS_LIFETIME_MS = 6000
export const BONUS_REACH_X = 14
export const POINTS_PER_BONUS = 50
