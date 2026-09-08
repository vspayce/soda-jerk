// All tunable numbers live here so balancing doesn't require hunting
// through game logic. Positions are percentages (0-100) along a lane.

export const LANE_COUNT = 4
export const STARTING_LIVES = 3

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
export const GLASS_RETURN_TRAVEL_MS = 4200

// Time (ms) for a served (happy) customer to walk off after being served.
// Fast — reads as being hustled off rather than a casual stroll, so a
// served customer doesn't linger in the lane long enough to tempt (and
// then waste) another matching drink thrown their way.
export const CUSTOMER_WALK_OUT_MS = 280

// A walking-in customer occasionally pauses for a beat instead of
// marching in a dead straight line — feels more like browsing, less
// like a conveyor belt, and gives more of a stuttering gait. Chance is
// per frame (~60fps), so on average that's roughly one pause every
// 2.5-3 seconds of walking.
export const WALK_PAUSE_CHANCE_PER_FRAME = 0.006
export const WALK_PAUSE_MIN_MS = 350
export const WALK_PAUSE_MAX_MS = 800

// Difficulty (customer spawn rate and travel speed) is gated by score,
// not survival time — see levels.js, which is the file to edit to
// retune pacing.

// Separate from the score-gated difficulty above: how many customers can
// queue up walking in the same lane at once, by stage (index 0 = stage
// 1). Stage 1 is one at a time; filling every lane and then clearing the
// whole bar at once bumps the player to stage 2, where a second patron
// can be waiting behind the first in every lane.
export const STAGE_LANE_CAPACITY = [1, 2]

// Extra slowdown applied to customerTravelMs by stage (index 0 = stage 1)
// on top of the score-gated pacing in levels.js — stage 2 has twice as
// many patrons walking at once, so this eases their pace back down to
// compensate, applied as a multiplier (1 = unchanged, higher = slower).
export const STAGE_TRAVEL_MULTIPLIER = [1, 1.2]

export const GLASS_RETURN_CHANCE = 0.35

// How long the bartender stays at the counter getting sprayed before the
// "YOU MISSED" pause kicks in.
export const SPRAY_HOLD_MS = 2000

// Same idea, but for a spill in a lane he isn't even standing in — no
// recall animation to wait for, just a short beat with the spray sound
// before the "YOU GOT SPRAYED!" screen shows up.
export const SPRAY_OTHER_LANE_HOLD_MS = 900

// How close (in x) the bartender has to run to a returning glass to
// auto-grab it just by being there, same as tapping it directly.
export const GLASS_REACH_X = 10

export const POINTS_PER_SERVE = 100
export const POINTS_PER_CAUGHT_GLASS = 50

// Selectable drink types — tap one of the taps to pour it. A customer's
// outfit color shows which one they want; the wrong drink just sails
// past them uncaught, same as throwing with no one there — it has to
// match to serve them.
export const DRINK_TYPES = [
  { name: 'Orange Creme', color: '#D9822B', icon: 'drink-orange.png', tapIcon: 'tap-orange.png' },
  { name: 'In the Hay', color: '#D9668A', icon: 'drink-pink.png', tapIcon: 'tap-pink.png' },
]

// How many different patron illustrations exist per drink color — purely
// cosmetic variety, picked at random when a customer spawns.
export const PATRON_TYPE_COUNT = 3

// A hot dog drops on the counter every so often, somewhere within the
// bartender's run range — reach it (JERK while close enough) before it
// goes cold for a bonus. Purely optional: ignoring one costs nothing.
export const BONUS_SPAWN_INTERVAL_MIN_MS = 9000
export const BONUS_SPAWN_INTERVAL_MAX_MS = 18000
export const BONUS_LIFETIME_MS = 6000
export const BONUS_REACH_X = 14
export const POINTS_PER_BONUS = 500

// The bonus ROUND (distinct from the hot dog bonus above) — an Angry
// Birds-style throw at a spinning wheel of malt cups, reached after
// clearing every lane at stage 2's cap. All coordinates below are
// percentages (0-100) of the bonus arena's own square play field, not
// the phone-frame — see BonusLevel.jsx.
export const BONUS_LEVEL_THROWS = 3
export const BONUS_LEVEL_POINTS = 500
// The wheel sits up in the right side of the arena; the scoop launches
// from the lower-left, so a throw arcs up and across, slingshot-style,
// rather than straight up the middle.
export const BONUS_WHEEL_CENTER = { x: 68, y: 32 }
// bonus-wheel.png's 4 cup slots sit at these fractions of the wheel
// image's own width/height, measured from its center — not a perfect
// circle (hand-painted art), so x and y get their own radius rather
// than one shared value.
export const BONUS_WHEEL_IMAGE_SIZE = 36 // wheel image width, % of arena
export const BONUS_WHEEL_HOLE_FRACTION_X = 0.37
export const BONUS_WHEEL_HOLE_FRACTION_Y = 0.32
export const BONUS_WHEEL_RADIUS_X = BONUS_WHEEL_IMAGE_SIZE * BONUS_WHEEL_HOLE_FRACTION_X
export const BONUS_WHEEL_RADIUS_Y = BONUS_WHEEL_IMAGE_SIZE * BONUS_WHEEL_HOLE_FRACTION_Y
export const BONUS_CUP_SIZE = 13 // each cup sprite's width, % of arena
export const BONUS_WHEEL_SPIN_DEG_PER_S = 40
export const BONUS_LAUNCH_ANCHOR = { x: 18, y: 35 }
export const BONUS_MAX_PULL = 25 // furthest the scoop can be dragged back
export const BONUS_MIN_PULL = 4 // shorter than this and releasing cancels the aim
// Launch power and gravity are tuned together so only a deliberate, fairly
// steep pull (mostly straight back, not just diagonal) arcs high enough to
// drop back down into the wheel — a flatter, half-hearted toss comes up
// short. Higher gravity than a lob really needs, on purpose, so the margin
// for error on power AND angle both stay tight.
export const BONUS_LAUNCH_POWER = 3.65 // arena-%/s of launch velocity per arena-% pulled
export const BONUS_GRAVITY = 85 // arena-%/s^2 pulling the scoop back down
export const BONUS_HIT_RADIUS = 6 // how close to a cup's center counts as landing in it
export const BONUS_RESULT_HOLD_MS = 1400 // how long HIT!/MISS shows before the next throw
export const BONUS_CUP_COUNT = 4
