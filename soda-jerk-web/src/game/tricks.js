// Flourishes the jerk pulls off between levels, instead of the screen just
// announcing the level number.
//
// A trick is a list of layers played against one shared clock: poses of the
// jerk cross-faded by keyframe, and props moved over the top. That split is
// the point — generating the body motion was tried first and wasn't good
// enough (the toss read as a shrug, and the generator drew a stray blob in
// his hand despite being told not to draw objects). Posing art the game
// already has, against real props, gives a cleaner trick and exact control
// over when something leaves his hand.
//
// Geometry is all expressed as a fraction of the animation's height, so a
// trick lays out identically at any size:
//   pose.feetX  - where that pose's feet sit across its own width, so two
//                 poses can be swapped without him jumping sideways
//   prop.x / .y - the prop's centre, x measured from the jerk's feet axis
//                 and y up from the counter
//
// To add a trick: add an entry here, add its keyframes in index.css, and
// list it in STAGE_TRICKS.

const STAND = { kind: 'pose', src: 'player-stand.png', aspect: 361 / 1006, feetX: 0.578 }
const THROW = { kind: 'pose', src: 'player-throw.png', aspect: 160 / 280, feetX: 0.497 }

export const TRICKS = {
  shakerFlip: {
    id: 'shakerFlip',
    name: 'THE SHAKER FLIP',
    durationMs: 1900,
    // How high the toss goes, from power 0 to 1. The level-pass screen
    // always throws at full power, so it's maxReach that shows.
    minReach: 0.45,
    maxReach: 1.85,
    layers: [
      { ...STAND, className: 'trick-pose-stand' },
      { ...THROW, className: 'trick-pose-throw' },
      // Launches from, and returns to, the throw pose's raised hand.
      {
        kind: 'prop',
        src: 'bonus-cup.png',
        aspect: 509 / 734,
        heightRatio: 0.3,
        x: -0.005,
        y: 0.83,
        className: 'trick-prop-shaker-flip',
      },
    ],
  },

  strawToss: {
    id: 'strawToss',
    name: 'THE STRAW TOSS',
    durationMs: 2000,
    // Only the arc's height varies — the straw still has to finish in the
    // cup, and that landing is fixed by the layout.
    minReach: 0.55,
    maxReach: 1.7,
    layers: [
      // A flick of the wrist, not a heave — he stays on the standing pose
      // the whole way through and the straw does the performing.
      { ...STAND, className: 'trick-pose-flick' },
      // A proper glass of soda for the straw to land in, slid into place
      // during the wind-up so the target arrives rather than just sitting
      // there. Its own art, with no straw drawn in it — the whole point of
      // the trick is putting one there.
      {
        kind: 'prop',
        src: 'trick-soda.png',
        aspect: 100 / 240,
        heightRatio: 0.42,
        x: 0.34,
        y: 0.21,
        className: 'trick-prop-straw-glass',
      },
      // Laid out where it LANDS — upright in the cup's mouth — and
      // animated from his hand to here, so the resting place is fixed by
      // the layout instead of by percentages accumulating down the
      // keyframe, which left it hanging in mid-air beside the cup.
      {
        kind: 'prop',
        src: 'trick-straw.png',
        aspect: 105 / 241,
        heightRatio: 0.23,
        x: 0.34,
        y: 0.36,
        className: 'trick-prop-straw',
      },
    ],
  },

  threeDrinkCarry: {
    id: 'threeDrinkCarry',
    name: 'THE THREE-DRINK CARRY',
    durationMs: 2100,
    // Power means something different here: not how high something flies,
    // but how many glasses he dares stack. Reach is unused.
    minReach: 1,
    maxReach: 1,
    layers: [
      { ...STAND, className: 'trick-pose-carry' },
      // Stacked on his outstretched hand, two at the lowest power and five
      // at full (which is what the level-pass screen plays). overlap < 1 so each glass sits down inside the
      // one below rather than floating a full height above it.
      {
        kind: 'prop',
        src: 'trick-soda.png',
        aspect: 100 / 240,
        heightRatio: 0.32,
        x: -0.24,
        y: 0.56,
        className: 'trick-prop-carry-glass',
        repeat: { min: 2, max: 5, overlap: 0.78 },
      },
    ],
  },
}

// Tricks cycle by how many clean clears the run has had, NOT by stage
// number. Keying off the stage meant the top stage's trick could never be
// reached, because clearing at the top stage goes to a bonus round — so
// with three stages only the first two tricks ever showed.
const TRICK_ORDER = ['shakerFlip', 'strawToss', 'threeDrinkCarry']

export function trickForClear(clearCount) {
  if (TRICK_ORDER.length === 0) return null
  const key = TRICK_ORDER[(Math.max(1, clearCount) - 1) % TRICK_ORDER.length]
  return TRICKS[key] ?? null
}
