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

// How long the bartender's throw-motion sprite plays after pourDrink(),
// before falling back to stand/run — see Player.jsx.
export const THROW_ANIM_MS = 500

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
// cosmetic variety, picked at random when a customer spawns. The two
// extra caricature patrons (indices 3 and 4) only show up once the
// stage-2+ soda-fountain venue kicks in — see trySpawnCustomer.
export const PATRON_TYPE_COUNT = 3
export const PATRON_TYPE_COUNT_FOUNTAIN = 5

// A hot dog drops on the counter every so often, somewhere in the middle
// or right portion of the bar (never right at the end near the player,
// where a missed customer already costs a life — this way reaching it
// always means actually running down the bar for it) — reach it (JERK
// while close enough) before it goes cold for a bonus. Purely optional:
// ignoring one costs nothing.
export const BONUS_SPAWN_INTERVAL_MIN_MS = 9000
export const BONUS_SPAWN_INTERVAL_MAX_MS = 18000
export const BONUS_LIFETIME_MS = 6000
export const BONUS_REACH_X = 14
export const BONUS_MIN_X = PLAYER_X + (PLAYER_MAX_X - PLAYER_X) * 0.45
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
export const BONUS_WHEEL_IMAGE_SIZE = 28 // wheel image width, % of arena
export const BONUS_WHEEL_HOLE_FRACTION_X = 0.37
export const BONUS_WHEEL_HOLE_FRACTION_Y = 0.32
export const BONUS_WHEEL_RADIUS_X = BONUS_WHEEL_IMAGE_SIZE * BONUS_WHEEL_HOLE_FRACTION_X
export const BONUS_WHEEL_RADIUS_Y = BONUS_WHEEL_IMAGE_SIZE * BONUS_WHEEL_HOLE_FRACTION_Y
export const BONUS_CUP_SIZE = 10 // each cup sprite's width, % of arena
// bonus-cup.png is 509x734, cropped tight to the cup's own silhouette —
// its opening sits right at the top edge of the image. The cup renders
// centered on its hole position, so the actual opening is this far above
// that center — a hit has to reach here, not just the cup's middle, to
// read as landing IN it rather than passing through its side.
export const BONUS_CUP_ASPECT = 734 / 509
export const BONUS_CUP_RIM_FRACTION_FROM_TOP = 0.08
export const BONUS_CUP_RIM_OFFSET_Y = (0.5 - BONUS_CUP_RIM_FRACTION_FROM_TOP) * BONUS_CUP_SIZE * BONUS_CUP_ASPECT
export const BONUS_WHEEL_SPIN_DEG_PER_S = 40
export const BONUS_LAUNCH_ANCHOR = { x: 18, y: 20 }
export const BONUS_MAX_PULL = 25 // furthest the scoop can be dragged back
export const BONUS_MIN_PULL = 4 // shorter than this and releasing cancels the aim
// Launch power and gravity are tuned together so only a deliberate, fairly
// steep pull (mostly straight back, not just diagonal) arcs high enough to
// drop back down into the wheel — a flatter, half-hearted toss comes up
// short. Higher gravity than a lob really needs, on purpose, so the margin
// for error on power AND angle both stay tight.
export const BONUS_LAUNCH_POWER = 3.65 // arena-%/s of launch velocity per arena-% pulled
export const BONUS_GRAVITY = 85 // arena-%/s^2 pulling the scoop back down
export const BONUS_HIT_RADIUS = 5 // how close to a cup's rim (see BONUS_CUP_RIM_OFFSET_Y) counts as landing in it
export const BONUS_RESULT_HOLD_MS = 1400 // how long HIT!/MISS shows before the next throw
// Each cup gets its own color (index order matches the angle formula:
// 0=right, 1=bottom, 2=left, 3=top). The scoop is randomly tinted one of
// these each throw — landing in a cup of a different color still stops
// it (can't fly through a metal cup) but doesn't score.
export const BONUS_CUP_COLORS = [
  { name: 'Strawberry', color: '#D9668A' },
  { name: 'Caramel', color: '#D9822B' },
  { name: 'Vanilla', color: '#E8DCC0' },
  { name: 'Chocolate', color: '#6B4226' },
]
export const BONUS_CUP_COUNT = BONUS_CUP_COLORS.length

// The second bonus round — a first-person plate-wash shooting gallery,
// reached right after the wheel-throw round finishes. Plates fly toward
// the camera in 3 lanes; spray a dirty one for points, but never a clean
// one — that ends the round on the spot. All coordinates are percentages
// of the full phone-frame (no square arena needed here — nothing in this
// round depends on true circular geometry). See PlatesLevel.jsx.
export const PLATES_ROUND_MS = 25000 // the round ends normally after this long
export const PLATES_SPAWN_INTERVAL_MIN_MS = 550
export const PLATES_SPAWN_INTERVAL_MAX_MS = 1000
export const PLATES_TRAVEL_MS = 700 // time for a plate to cross from spawn to the player
// Odds a freshly spawned plate is each kind — must add to 1.
export const PLATES_KIND_WEIGHTS = { dirty: 0.72, clean: 0.16, dollar: 0.12 }
export const PLATES_DIRTY_POINTS = 25
export const PLATES_DOLLAR_POINTS = 100
export const PLATES_RESULT_HOLD_MS = 1800
// Three separate conveyor belts, one per lane, each entering from its own
// direction (top-left, top-center, top-right) and growing as it approaches
// — they read as three distinct belts converging on the player, not one
// shared chute fanning out.
export const PLATES_LANES = ['left', 'center', 'right']
export const PLATES_LANE_PATHS = {
  center: { startX: 50, startY: 8, endX: 50, endY: 92 },
  left: { startX: 10, startY: 16, endX: 12, endY: 88 },
  right: { startX: 90, startY: 16, endX: 88, endY: 88 },
}
export const PLATES_START_SCALE = 0.12
export const PLATES_END_SCALE = 1.15
export const PLATES_BASE_SIZE_PCT = 30 // plate width at scale 1, % of screen width

// The third bonus round — the jerk again seen from behind (same viewpoint
// as the plate wash), this time facing three rows of shaker cups packed
// right next to each other, each row a continuous belt of cups scrolling
// past like a sushi conveyor. The throw itself is Angry-Birds style, same
// pull-back-and-release physics as the wheel round (see BONUS_* above):
// pull harder to arc higher and reach an upper row, land the scoop on a
// cup wherever the arc actually carries it. All coordinates are
// percentages of the full phone-frame, same as the plate wash. See
// ShakerLevel.jsx / stepShaker().
export const SHAKER_ROUND_THROWS = 6
export const SHAKER_HIT_POINTS = 75
export const SHAKER_RESULT_HOLD_MS = 900 // brief HIT!/MISS pause before the next throw's allowed
export const SHAKER_ROUND_END_HOLD_MS = 1800 // how long the final result shows before returning to the bar
// Row order top-to-bottom; alternating dir gives the belts visual variety,
// same spirit as the plate wash's three different conveyor entry points.
// `scale` shrinks the top row and grows the bottom one, so the belts read
// as receding into the distance like the rest of the venue's perspective
// (see PerspectiveBackdrop's converging walls) instead of three flat,
// same-size lanes.
export const SHAKER_ROWS = [
  { lane: 'top', y: 28, dir: 1, scale: 0.72 },
  { lane: 'middle', y: 50, dir: -1, scale: 1 },
  { lane: 'bottom', y: 72, dir: 1, scale: 1.3 },
]
export const SHAKER_CUP_SIZE_PCT = 13 // cup width at scale 1, % of screen width
// Cups in a row sit right next to each other — spacing is only a hair
// wider than the cup itself — and the belt runs off both edges of the
// screen so the train reads as endless, not a fixed row of props. Also
// at scale 1; scaled per-row same as the cup size so smaller/bigger cups
// still pack snugly instead of gapping or overlapping.
export const SHAKER_CUP_SPACING_PCT = 17
export const SHAKER_TRACK_PAD_PCT = 20 // offscreen overhang each side, for a seamless wrap
export const SHAKER_CUP_SPEED_MIN_X = 14 // %/s
export const SHAKER_CUP_SPEED_MAX_X = 22

// Throw physics — a slingshot pull-back from the jerk's raised hand, same
// shape as the BONUS_* wheel-round constants above. The pull is a real
// finger drag on a real screen, so the anchor's distance to the BOTTOM
// edge (where the pull-back drag actually has to go, since every row is
// above the anchor) is the hard ceiling on how far a throw can reach —
// not just the MAX_PULL number. At y:80 that ceiling was only 20 (100 -
// 80), while reaching the top row needed a pull of ~28: physically
// further than a thumb can drag on the actual device, even though it
// worked fine in testing via synthetic pointer coordinates that don't
// respect the viewport edge. Retuned so the top row needs well under
// that ceiling.
export const SHAKER_LAUNCH_ANCHOR = { x: 50, y: 76 }
export const SHAKER_MAX_PULL = 20 // furthest the scoop can be dragged back
export const SHAKER_MIN_PULL = 4 // shorter than this and releasing cancels the aim
export const SHAKER_LAUNCH_POWER = 7 // arena-%/s of launch velocity per arena-% pulled
export const SHAKER_GRAVITY = 131 // arena-%/s^2 pulling the scoop back down
// A ~16-18 pull's apex lands close to the top row's y, comfortably
// inside the 24-wide room below the anchor — weaker pulls peak lower,
// at the middle or bottom row instead.
export const SHAKER_CUP_HIT_RADIUS_X = 7 // how close to a cup's center (in x) counts as landing in it
export const SHAKER_CUP_HIT_RADIUS_Y = 7 // how close to a row's y counts as reaching that row
