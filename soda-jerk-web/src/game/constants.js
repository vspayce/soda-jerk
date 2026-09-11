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
// One full walk cycle (see the 900ms patron-walk-cycle animation), so a
// served customer takes exactly one stride's worth of animation to clear
// the lane and actually reads as walking out.
//
// This used to be 280ms to stop a served customer lingering long enough
// to tempt another (wasted) drink thrown their way. That backfired: at
// that speed they crossed most of the screen in about two frames of an
// eight-frame cycle, so their legs were nearly frozen — it read as
// moonwalking backwards, not walking out. And it never actually solved
// the wasted-drink problem, because speed was the only thing
// distinguishing them. Telling them apart is now the job of a clear
// visual cue instead (see Customer.jsx's leaving-happy styling).
export const CUSTOMER_WALK_OUT_MS = 900
// How long a served patron stands still holding the drink they just
// caught, before turning to leave — see the 'toasting' status.
export const CUSTOMER_TOAST_MS = 620

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
export const GLASS_FALL_HOLD_MS = 700 // how long a missed glass's tumble-off-
// the-counter animation plays before the "YOU MISSED" screen shows up

// How close (in x) the bartender has to run to a returning glass to
// auto-grab it just by being there, same as tapping it directly.
export const GLASS_REACH_X = 10

// Between-level trick flourish (see game/tricks.js). Hold to wind up,
// let go to throw: the longer the hold the further it goes and the bigger
// the bonus, capping at full rather than busting — the trick is a victory
// lap, so a badly-timed release just earns less, it never costs anything.
export const TRICK_CHARGE_MS = 1150
export const TRICK_MAX_BONUS = 300

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

// Relative spawn odds for the 8 patron illustrations (per drink color),
// picked when a customer spawns — see trySpawnCustomer. The professor
// (Einstein-styled, index 4) is weighted above an even share so he shows
// up noticeably more than the others; the three newest caricatures
// (aviator/showman/gangster, indices 5-7) get a smaller bump of their own.
//
// These used to be gated to the stage-2+ fountain venue, with stage 1
// limited to the first three types. But reaching stage 2 means filling
// every lane at once and then clearing all of them without losing a
// life — demanding enough that a player could go a long time without
// ever laying eyes on the caricatures, which are the most fun art in the
// game. They spawn from the first customer now.
export const PATRON_TYPE_WEIGHTS = [1, 1, 1, 1, 3, 2, 2, 2]

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
export const PLATES_TRAVEL_MS = 1050 // time for a plate to cross from spawn to the player
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
// as the plate wash), this time facing three rows of shaker cups, each
// row a continuous belt of cups scrolling past like a sushi conveyor.
// The throw itself is Angry-Birds style, same pull-back-and-release
// physics as the wheel round (see BONUS_* above):
// pull harder to arc higher and reach an upper row, land the scoop on a
// cup wherever the arc actually carries it. All coordinates are
// percentages of the full phone-frame, same as the plate wash. See
// ShakerLevel.jsx / stepShaker().
export const SHAKER_ROUND_THROWS = 6
export const SHAKER_RESULT_HOLD_MS = 900 // brief HIT!/MISS pause before the next throw's allowed
export const SHAKER_ROUND_END_HOLD_MS = 1800 // how long the final result shows before returning to the bar
// Real 1950s soda-fountain counter slang — the jargon a jerk shouted
// back to the fountain when an order came in. This is the one source of
// truth for it: the lingo glossary screen lists all of it, DRINK_TYPES'
// "In the Hay" and the game-over screen's "Pop Boy" come from it, and
// the shaker round shouts a subset on a landed hit (see below).
export const JERK_LINGO = [
  { term: 'Add Another', def: 'coffee' },
  { term: 'All Black', def: 'chocolate soda with chocolate ice cream' },
  { term: 'Baby', def: 'glass of fresh milk' },
  { term: 'Black Bottom', def: 'chocolate sundae with chocolate syrup' },
  { term: 'Black Cow', def: 'root beer' },
  { term: 'C. O. Cocktail', def: 'castor oil prepared in soda' },
  { term: 'Canary Island Special', def: 'vanilla soda with chocolate cream' },
  { term: 'Choc In', def: 'chocolate soda' },
  { term: 'Choker Holes', def: 'doughnuts' },
  { term: 'Coffee And', def: 'cup of coffee and cake' },
  { term: 'Cowcumber', def: 'pickle' },
  { term: 'Draw Some Mud', def: 'coffee' },
  { term: 'Give', def: 'large glass of fresh milk' },
  { term: 'Glass Slide', def: 'a drink sent skidding down the counter' },
  { term: 'Glob', def: 'plain sundae' },
  { term: 'In the Hay', def: 'strawberry milkshake' },
  { term: "Maiden's Delight", def: 'cherries' },
  { term: 'Mug of Murk', def: 'cup of coffee without cream' },
  { term: 'Ninety-Five', def: 'customer walking out without paying' },
  { term: 'Oh Gee', def: 'orangeade' },
  { term: 'One On The House', def: 'water' },
  { term: 'Pop Boy', def: "soda man who doesn't know his business" },
  { term: 'Rhinelander', def: 'chocolate soda with vanilla ice cream' },
  { term: 'Saltwater Man', def: 'ice cream mixer' },
  { term: 'Scandal Soup', def: 'tea' },
  { term: 'Yum-Yum', def: 'sugar' },
]

// A landed shaker HIT shouts one of these instead of a plain "HIT!" (see
// stepShaker/ShakerLevel.jsx) — only the terms that name something you'd
// plausibly be scooping, so the shout fits what just happened.
const SHAKER_HIT_TERMS = [
  'All Black', 'Black Bottom', 'Black Cow', 'Canary Island Special', 'Choc In',
  'Give', 'Glob', 'Oh Gee', 'Rhinelander', 'Saltwater Man',
]
export const SHAKER_HIT_JARGON = JERK_LINGO.filter((e) => SHAKER_HIT_TERMS.includes(e.term))
// Row order top-to-bottom; alternating dir gives the belts visual variety,
// same spirit as the plate wash's three different conveyor entry points.
// `scale` shrinks the top row and grows the bottom one (and its hit
// radius along with it — see stepShaker), so the far row is a genuinely
// smaller target than the near one, matching the venue's perspective
// (see PerspectiveBackdrop's converging walls). `points` rewards that
// difficulty — the hard-to-hit back row pays out the most.
export const SHAKER_ROWS = [
  { lane: 'top', y: 28, dir: 1, scale: 0.72, points: 150 },
  { lane: 'middle', y: 50, dir: -1, scale: 1, points: 75 },
  { lane: 'bottom', y: 72, dir: 1, scale: 1.1, points: 40 },
]
export const SHAKER_CUP_SIZE_PCT = 13 // cup width at scale 1, % of screen width
// Roughly every-other-cup gaps now, not packed shoulder to shoulder — at
// scale 1; scaled per-row same as the cup size so smaller/bigger cups
// keep proportionally the same gap instead of one row looking tighter.
export const SHAKER_CUP_SPACING_PCT = 32
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
// The jerk is drawn so his throwing hand lands on this anchor, and his
// hand sits at 20.8% across his sprite — so anchoring at x:50 pushed his
// body ~9% right of centre. Offsetting the anchor by that same amount
// puts his body on the centre line with the hand (and the scoop leaving
// it) just left of it. See JERK_HAND_FRACTION in ShakerLevel.jsx.
export const SHAKER_LAUNCH_ANCHOR = { x: 41, y: 76 }
export const SHAKER_MAX_PULL = 20 // furthest the scoop can be dragged back
export const SHAKER_MIN_PULL = 4 // shorter than this and releasing cancels the aim
export const SHAKER_LAUNCH_POWER = 7 // arena-%/s of launch velocity per arena-% pulled
export const SHAKER_GRAVITY = 131 // arena-%/s^2 pulling the scoop back down
// A ~16-18 pull's apex lands close to the top row's y, comfortably
// inside the 24-wide room below the anchor — weaker pulls peak lower,
// at the middle or bottom row instead.
// Widened from 7/7 — landing on a cup at all is only half the job now
// that flavor has to match too (a 1-in-4 shot even when you land clean),
// and the wider cup spacing (SHAKER_CUP_SPACING_PCT) already made just
// landing harder. Without more forgiveness here a genuine HIT (and its
// jargon) got rare enough to barely show up.
// A scoop has to drop into the cup's MOUTH, not merely land somewhere
// near the cup — hitting halfway down the side used to count, which read
// as the ice cream passing through the metal. The cup art is centred on
// the row line and is 734/509 as tall as it is wide, so its rim sits
// about 0.36 x its width above that centre (the factor folds in the
// frame's own ~1:2 aspect, since a cup's width is a share of the frame's
// width but its rim offset has to be a share of the frame's height).
// Everything scales with the cup, so the small far-row cups stay a
// genuinely smaller target.
export const SHAKER_RIM_OFFSET_FACTOR = 0.36 // x cup width, above cup centre
export const SHAKER_RIM_HALF_WIDTH_FACTOR = 0.46 // x cup width, the mouth's half-span


// The fourth bonus round — three bars running away from the player at an
// angle, a customer waiting at the far end of each. Swipe up a bar to
// send a glass sliding along it: the flick's length sets how hard it goes,
// friction slows it, and where it comes to rest is the whole game. Stop it
// in the customer's reach and it's served; too soft and it stalls short;
// too hard and it goes off the end and smashes. Smashing costs the points,
// never a life — the bonus rounds stay a reward.
//
// Every bar is parameterised 0 (near end, in front of the player) to 1
// (the far end where the customer stands), so one set of numbers describes
// all three regardless of their on-screen angle. See SlideLevel.jsx for
// how a t maps back to a screen position.
export const SLIDE_ROUND_SLIDES = 6
export const SLIDE_RESULT_HOLD_MS = 850
export const SLIDE_ROUND_END_HOLD_MS = 1800

// Where each bar sits on screen, near end to far end, in frame percentages.
// They fan out from the player so they read as receding into the room.
export const SLIDE_BARS = [
  { lane: 'left',   near: { x: 16, y: 96 }, far: { x: 30, y: 30 } },
  { lane: 'middle', near: { x: 50, y: 99 }, far: { x: 55, y: 26 } },
  { lane: 'right',  near: { x: 84, y: 96 }, far: { x: 80, y: 30 } },
]

// The customer's reach at the far end. Land inside this band and the slide
// is served; past 1 the glass leaves the bar entirely.
export const SLIDE_TARGET_MIN_T = 0.78
export const SLIDE_TARGET_MAX_T = 0.98
export const SLIDE_PERFECT_MIN_T = 0.88 // tighter band inside it, worth more

export const SLIDE_POINTS = 120
export const SLIDE_PERFECT_POINTS = 250

// Flick -> how far it slides. The swipe is measured along the bar's own
// direction, as a fraction of the frame's height, so a flick feels the
// same whichever bar it's on.
//
// The flick maps to a DISTANCE and the launch speed is derived from it
// (v = sqrt(2 * friction * distance)), rather than mapping the flick
// straight to a speed. Under friction, distance goes as the square of
// speed, so a flick-to-speed mapping crams the whole useful range into
// the last few percent of the swipe and everything below it stalls
// short — measured, a full-length flick still only reached t=0.36.
// Going via distance keeps the control linear, which is what makes it
// aimable.
export const SLIDE_MIN_FLICK = 0.05 // shorter than this and it's a stray tap, not a throw
export const SLIDE_MAX_FLICK = 0.34
export const SLIDE_MIN_DIST = 0.15 // where the gentlest real flick stops
export const SLIDE_MAX_DIST = 1.15 // hardest flick overshoots the end, on purpose
export const SLIDE_FRICTION = 1.55 // t-per-second-squared slowing it down

// Glasses shrink as they travel away, matching the bars converging.
export const SLIDE_GLASS_NEAR_PCT = 13
export const SLIDE_GLASS_FAR_PCT = 6
