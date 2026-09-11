// Flourishes the jerk pulls off between levels, instead of the screen just
// announcing the level number.
//
// A trick is built from poses the game already has plus a prop moved over
// the top by a CSS keyframe. That split is deliberate: generating the body
// motion was tried first and wasn't good enough — the toss read as a shrug,
// and the generator drew a stray blob in his hand despite being told not to
// draw objects. Posing existing art and animating the prop deterministically
// gives a cleaner trick and exact control over when the cup leaves his hand.
//
// Measured off the art (see the numbers below): both poses put his head at
// ~10% from the top, so rendering them at the same height keeps his body the
// same size; only the horizontal anchor differs, because the throw pose's
// raised arm widens the frame.

// Where each pose's feet sit across its own width — used to line the two
// poses up on the same spot so he doesn't jump sideways on the swap.
const STAND = { src: 'player-stand.png', aspect: 361 / 1006, feetX: 0.578 }
const THROW = { src: 'player-throw.png', aspect: 160 / 280, feetX: 0.497 }
// His raised hand in the throw pose, as a fraction of that pose's box —
// where the cup launches from and returns to.
const THROW_HAND = { x: 0.488, y: 0.02 }

export const TRICKS = {
  shakerFlip: {
    id: 'shakerFlip',
    name: 'THE SHAKER FLIP',
    durationMs: 1900,
    poses: { stand: STAND, throw: THROW },
    hand: THROW_HAND,
    prop: {
      src: 'bonus-cup.png',
      aspect: 509 / 734,
      // height as a share of the jerk's own height
      heightRatio: 0.3,
      className: 'trick-prop-shaker-flip',
    },
  },
}

// Which trick each cleared level shows. Levels past the end cycle back
// through, so adding a trick here is all it takes to put it in rotation.
const STAGE_TRICKS = ['shakerFlip']

export function trickForStage(stage) {
  if (STAGE_TRICKS.length === 0) return null
  const key = STAGE_TRICKS[(Math.max(1, stage) - 1) % STAGE_TRICKS.length]
  return TRICKS[key] ?? null
}
