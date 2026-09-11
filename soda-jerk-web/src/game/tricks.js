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
    // How high the toss goes at the weakest and strongest wind-up.
    minReach: 0.62,
    maxReach: 1.32,
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
    minReach: 0.7,
    maxReach: 1.28,
    layers: [
      // A flick of the wrist, not a heave — he stays on the standing pose
      // the whole way through and the straw does the performing.
      { ...STAND, className: 'trick-pose-flick' },
      // The vessel waits on the counter off to his side for the straw to
      // land in. Deliberately the solid shaker cup rather than
      // glass-empty.png — that art is a faint outline meant to be read
      // against its own glow on the counter, and it all but disappears here.
      {
        kind: 'prop',
        src: 'bonus-cup.png',
        aspect: 509 / 734,
        heightRatio: 0.34,
        x: 0.34,
        y: 0.17,
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
}

// Which trick each cleared level shows. Levels past the end cycle back
// through, so adding a trick here is all it takes to put it in rotation.
const STAGE_TRICKS = ['shakerFlip', 'strawToss']

export function trickForStage(stage) {
  if (STAGE_TRICKS.length === 0) return null
  const key = STAGE_TRICKS[(Math.max(1, stage) - 1) % STAGE_TRICKS.length]
  return TRICKS[key] ?? null
}
