const ART_SRC = (name) => `${import.meta.env.BASE_URL}art/${name}`

// Plays one of the jerk's between-level flourishes (see game/tricks.js).
// The two poses are stacked and cross-faded by keyframe, both scaled to the
// same height and offset so their feet land on the same spot; the prop
// arcs over the top on its own keyframe, timed so it leaves his hand
// exactly when the throw pose appears.
export default function TrickAnimation({ trick, height = 165 }) {
  if (!trick) return null

  const { stand, throw: throwPose } = trick.poses
  const standW = height * stand.aspect
  const throwW = height * throwPose.aspect
  // Line both poses up on one vertical axis through his feet.
  const standLeft = -standW * stand.feetX
  const throwLeft = -throwW * throwPose.feetX

  const propH = height * trick.prop.heightRatio
  const propW = propH * trick.prop.aspect
  // Launch point: his raised hand in the throw pose.
  const propLeft = throwLeft + throwW * trick.hand.x - propW / 2
  const propBottom = height - height * trick.hand.y - propH

  const ms = `${trick.durationMs}ms`

  return (
    <div className="relative w-full" style={{ height }}>
      {/* the counter he's working over, so the trick has a stage */}
      <div
        className="absolute left-0 right-0"
        style={{
          bottom: 0,
          height: 3,
          background:
            'linear-gradient(90deg, transparent 0%, rgba(198,161,91,0.5) 20%, rgba(198,161,91,0.5) 80%, transparent 100%)',
        }}
      />

      {/* Everything below is positioned relative to this single zero-width
          point, so the poses and the prop can't drift apart from each
          other. The children therefore need max-width:none — Tailwind's
          preflight caps images at max-width:100%, which against a
          zero-width containing block collapses them to nothing. */}
      <div className="absolute" style={{ left: '50%', bottom: 3, width: 0, height }}>
        <img
          src={ART_SRC(stand.src)}
          alt=""
          className="absolute trick-pose-stand"
          style={{ left: standLeft, bottom: 0, width: standW, height, animationDuration: ms, maxWidth: 'none' }}
        />
        <img
          src={ART_SRC(throwPose.src)}
          alt=""
          className="absolute trick-pose-throw"
          style={{ left: throwLeft, bottom: 0, width: throwW, height, animationDuration: ms, maxWidth: 'none' }}
        />
        <img
          src={ART_SRC(trick.prop.src)}
          alt=""
          className={`absolute ${trick.prop.className}`}
          style={{ left: propLeft, bottom: propBottom, width: propW, height: propH, animationDuration: ms, maxWidth: 'none' }}
        />
      </div>
    </div>
  )
}
