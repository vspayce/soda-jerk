// All tunable numbers live here so balancing doesn't require hunting
// through game logic. Positions are percentages (0-100) along a lane.

export const LANE_COUNT = 4
export const STARTING_LIVES = 3
// An extra life every time the score crosses another multiple of this, the
// way the arcade cabinets did it. Repeating rather than one-off, so a long
// run keeps being rewarded.
export const EXTRA_LIFE_EVERY = 10000

// x-position (%) of the bartender's home spot at the near end of the
// counter, and how far right they can run along it (left/right controls),
// at what speed (%/s).
export const PLAYER_X = 12
export const PLAYER_MAX_X = 85
export const PLAYER_RUN_SPEED_X = 70

// If an unserved customer's x reaches this point, they've made it all
// the way down the bar — lose a life. Only a drink (or the dachshund's
// show) stops them.
export const END_OF_BAR_X = PLAYER_X + 4

export const OFFSCREEN_X = 108

// Where the saloon doors stand (see Lane.jsx). A patron entering is hidden
// until they reach it, and a shove that carries someone past it takes them
// the rest of the way out — nobody stops to drink out of sight in the
// doorway and sends an empty back from nowhere.
export const DOOR_X = 95

// Visual-only: height (px) of the counter graphic in Lane.jsx. Characters
// anchor their feet to its bottom edge (so heads clear the top); mugs and
// glasses ride along its top edge (so they read as sliding on the surface,
// not passing through the middle of it).
export const COUNTER_HEIGHT_PX = 44

// Time (ms) for a mug to cross the full bar length if nothing's in the way.
export const MUG_TRAVEL_MS = 800

// How long the bartender's throw-motion sprite plays after pourDrink(),
// before falling back to stand/run — see Player.jsx.
export const THROW_ANIM_MS = 500

// A served customer doesn't turn around and walk out — the drink shoves
// them back down the bar, still facing the bartender. They
// slide rather than walk, which is why this can be brisk: the old walk-out
// had to stay slow enough for a leg cycle to keep up with it, and every
// version of the backwards-walking bug came out of that constraint. A
// shove has no gait to match.
// A drink shoves them a fixed DISTANCE back down the bar — it
// doesn't send them away. If the shove doesn't carry them off the far
// end they stop to drink, slide the empty back, and come on again, so a
// patron who got close takes several drinks to clear. That's the whole tension of the bar:
// one drink buys you room, not a solved customer.
export const CUSTOMER_PUSH_SPEED = 62 // lane-% per second at the moment of impact
export const CUSTOMER_PUSH_DISTANCE = 34 // how far one drink moves them
export const CUSTOMER_PUSH_MIN_SPEED = 9 // so the slide always finishes
// The mom-and-son pair is two people to shift, so one drink moves them
// less — which is what their old "needs 2 drinks" special case really
// meant, expressed in the same currency as everyone else.
export const CUSTOMER_PUSH_RESISTANCE = { 1: 0.55 }
// The beat of impact before the slide takes hold — long enough to register
// the catch, not a pose.
export const CUSTOMER_TOAST_MS = 220

// Patrons come on in even steps: WALK_STEP of the bar (lane %), then a
// stand of WALK_STEP_PAUSE_MS clamouring for a drink, then the next step.
// The pause is scaled by the level's pace (against level 1), so faster
// levels stop for less time as well as walking quicker.
export const WALK_STEP = 7
export const WALK_STEP_PAUSE_MS = 650

// Pacing and the crowd for each level live in levels.js.

// The venue: stage 1 is the speakeasy, stage 2 on the soda fountain (see
// PerspectiveBackdrop.jsx). It moves up one per level passed and stops at
// the top.
export const STAGE_COUNT = 3

// A bonus round follows every this-many levels passed.
export const BONUS_EVERY_LEVELS = 3

// A new patron (or one coming back in) waits at the door until whoever
// came in before them in that lane has walked at least this far in, so
// they don't enter stacked on top of each other.
export const DOOR_GAP_X = 14

// Each level opens with this many of every bar's crowd already standing at
// the far end of it, by the doors, rather than everyone walking in.
export const STARTING_PER_BAR = 2
export const STARTING_X = [91, 82] // just inside the doors

// The show: grabbing the hot dog sets the dachshund dancing (see
// Celebration.jsx) for SHOW_MS. Each patron walking in at that moment has
// SHOW_WATCH_CHANCE of turning round to watch. A watcher stops advancing
// and isn't thirsty — a drink sent at them slides straight past, out the
// door. Some lose interest before the dog's done.
export const SHOW_MS = 9800
export const SHOW_WATCH_CHANCE = 0.6
export const SHOW_MIN_WATCH_FRACTION = 0.55
export const SHOW_MIN_WATCHER_X = 88

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

// Between-level trick flourish (see game/tricks.js). It plays itself when
// a level is passed and pays this flat bonus — the reward for the clear.
export const TRICK_BONUS = 300
// A beat on the pose before he throws, so the screen has settled and the
// throw reads as the payoff rather than something already under way.
export const TRICK_THROW_DELAY_MS = 450

// Points come from knocking a patron clean out the door — more at the
// fancier venues (index = stage - 1) — and from catching the empties they
// slide back. A drink that only shoves them back earns nothing by itself.
export const OUST_POINTS_BY_STAGE = [50, 100, 150]
export const POINTS_PER_CAUGHT_GLASS = 100

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
// up noticeably more than the others; the caricatures that came after him
// (aviator/showman/gangster, indices 5-7, the clown, 8, and the slugger,
// G-man and flapper, 9-11) get a smaller bump of their own.
//
// These used to be gated to the stage-2+ fountain venue, with stage 1
// limited to the first three types. But reaching stage 2 means filling
// every lane at once and then clearing all of them without losing a
// life — demanding enough that a player could go a long time without
// ever laying eyes on the caricatures, which are the most fun art in the
// game. They spawn from the first customer now.
export const PATRON_TYPE_WEIGHTS = [1, 1, 1, 1, 3, 2, 2, 2, 2, 2, 2, 2]

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


// The fourth bonus round — an endless glass slide. Three bars run away
// from the player at a hard left angle, and patrons keep coming down them
// toward you. Swipe a glass up a bar to meet one; the flick's length sets
// how far it goes and friction does the rest. Miss enough and one reaches
// the near end, which ends the round. No throw limit — you keep swiping as
// fast as you can until one gets through.
//
// The steep leftward angle is deliberate: a near-vertical bar puts the
// swipe right on the bottom edge of the screen, where iOS reads it as the
// app-switcher gesture instead.
//
// Every bar is parameterised 0 (the near end, in front of the player) to 1
// (the far end the patrons come from), so one set of numbers describes all
// three regardless of on-screen angle. See SlideLevel.jsx.
export const SLIDE_END_HOLD_MS = 1900

// Near ends are kept well clear of the bottom edge for the same reason.
export const SLIDE_BARS = [
  { lane: 'top',    near: { x: 86, y: 51 }, far: { x: 12, y: 21 } },
  { lane: 'middle', near: { x: 86, y: 68 }, far: { x: 12, y: 38 } },
  { lane: 'bottom', near: { x: 86, y: 85 }, far: { x: 12, y: 55 } },
]

export const SLIDE_POINTS = 90
export const SLIDE_HIT_T = 0.07 // how close along the bar counts as meeting a patron

// Patrons come down from the far end toward you, and keep coming faster.
export const SLIDE_PATRON_SPEED_MIN = 0.2 // t per second
export const SLIDE_PATRON_SPEED_MAX = 0.31
export const SLIDE_SPAWN_MIN_MS = 620
export const SLIDE_SPAWN_MAX_MS = 1250
export const SLIDE_RAMP_MS = 45000 // how long until the round is at full tilt
export const SLIDE_SPAWN_RAMP = 0.35 // final spawn interval as a fraction of the starting one
// Speed ramps as well as spawn rate. Without this the round only ever got
// busier, never quicker — the same easy reaction window however long you
// survived, which is what made it a waiting game rather than a test.
export const SLIDE_SPEED_RAMP = 1.5 // final patron speed as a multiple of the starting one

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
export const SLIDE_MIN_DIST = 0.12 // where the gentlest real flick stops
export const SLIDE_MAX_DIST = 1.2 // hardest flick runs the whole bar and off the end
export const SLIDE_FRICTION = 1.55 // t-per-second-squared slowing it down

// Glasses and patrons shrink as they get further away.
export const SLIDE_GLASS_NEAR_PCT = 11
export const SLIDE_GLASS_FAR_PCT = 5

// EXPERIMENTAL fifth bonus round — a Tempest-style web. Spokes radiate from
// a hub; patrons climb each one from the hub outward, and the jerk runs the
// rim throwing back down whichever spoke he's standing on. He fires on a
// cooldown by himself, so the only thing the player does is move — being on
// the wrong side of the circle is the whole danger, same as Tempest.
//
// Slotted in as a bonus round on purpose while it's an experiment: it's
// self-contained and can be pulled out by deleting its files and its entry
// in the bonus rotation. If it graduates to a mode of its own, the round
// timer is the thing to drop — "until one gets all the way up" is the real
// premise, and the timer only exists to make it terminate like the other
// rounds do.
// No round timer: it runs until somebody climbs all the way out to the
// rim, the way Tempest does. It still always ends, because both the spawn
// rate and the climbing speed keep ramping up over TEMPEST_RAMP_MS.
export const TEMPEST_RAMP_MS = 45000
export const TEMPEST_END_HOLD_MS = 1800
export const TEMPEST_SPOKES = 8

// The frame is far from square, so the web is an ellipse in percentage
// space with its own x and y radius — same approach as the wheel round's
// BONUS_WHEEL_RADIUS_X/Y.
// y-radius is the x-radius scaled by the frame's aspect (~420x860), or the
// "circle" comes out as an upright oval — percentages aren't square here.
export const TEMPEST_CENTER = { x: 50, y: 58 }
export const TEMPEST_RADIUS_X = 42
export const TEMPEST_RADIUS_Y = 20.5

// How fast the jerk travels around the rim, in spokes per second. Low
// enough that crossing the circle costs real time.
export const TEMPEST_JERK_SPEED = 5.2 // spokes per second

// Patrons climb from the hub (t=0) to the rim (t=1).
// Measured: at 0.2-0.32 the first climber reached the rim about four
// seconds in, so a round was over before you could cross the circle even
// once. The ramp below is what makes the round end, so the opening speed
// only has to be playable — this is a touch quicker than it was, and gets
// genuinely fast on its own.
// Then 15% quicker again — it was still too easy.
export const TEMPEST_PATRON_SPEED_MIN = 0.195 // t per second
export const TEMPEST_PATRON_SPEED_MAX = 0.3
// Climbing speed ramps as well as spawn rate, so the round tightens
// instead of just getting more crowded — and so it ends without a timer.
export const TEMPEST_SPEED_RAMP = 1.6
// 15% more climbers than before (intervals cut by 1/1.15).
export const TEMPEST_SPAWN_MIN_MS = 780
export const TEMPEST_SPAWN_MAX_MS = 1650
// Ramps up over the round so it keeps tightening.
export const TEMPEST_SPAWN_RAMP = 0.55 // final interval as a fraction of the starting one

export const TEMPEST_FIRE_COOLDOWN_MS = 420
export const TEMPEST_GLASS_SPEED = 1.5 // t per second, travelling inward
export const TEMPEST_HIT_T = 0.06 // how close along the spoke counts as a hit
export const TEMPEST_POINTS = 60
