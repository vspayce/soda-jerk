const ART_SRC = (name) => `${import.meta.env.BASE_URL}art/${name}`

// Plays one of the jerk's between-level flourishes (see game/tricks.js).
// Every layer is laid out against one anchor point on his feet and driven
// by one shared clock, so poses and props can't drift apart from each
// other however the animation is sized.
export default function TrickAnimation({ trick, height = 165 }) {
  if (!trick) return null
  const ms = `${trick.durationMs}ms`

  const layerStyle = (layer) => {
    if (layer.kind === 'pose') {
      const w = height * layer.aspect
      return { left: -w * layer.feetX, bottom: 0, width: w, height }
    }
    const h = height * layer.heightRatio
    const w = h * layer.aspect
    return {
      left: height * layer.x - w / 2,
      bottom: height * layer.y - h / 2,
      width: w,
      height: h,
    }
  }

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

      {/* Everything hangs off this single zero-width point on his feet. The
          children therefore need max-width:none — Tailwind's preflight caps
          images at max-width:100%, which against a zero-width containing
          block collapses them to nothing at all. */}
      <div className="absolute" style={{ left: '50%', bottom: 3, width: 0, height }}>
        {trick.layers.map((layer, i) => (
          <img
            key={`${layer.src}-${i}`}
            src={ART_SRC(layer.src)}
            alt=""
            className={`absolute ${layer.className}`}
            style={{ ...layerStyle(layer), animationDuration: ms, maxWidth: 'none' }}
          />
        ))}
      </div>
    </div>
  )
}
