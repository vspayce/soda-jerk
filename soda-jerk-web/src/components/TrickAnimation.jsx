import { ART_SRC } from '../game/art.js'

// Plays one of the jerk's between-level flourishes (see game/tricks.js).
// Every layer is laid out against one anchor point on his feet and driven
// by one shared clock, so poses and props can't drift apart from each
// other however the animation is sized.
// How much clear space to leave above the jerk, as a share of his height.
// The cup launches from his raised hand, which is already near the top of
// him, so without headroom a big throw just flies out of the box.
const HEADROOM = 0.75

export default function TrickAnimation({ trick, height = 165, power = 1, paused = false }) {
  if (!trick) return null
  const ms = `${trick.durationMs}ms`
  // How far the throw goes (the level-pass screen always throws at full).
  // Fed to the keyframes as a custom property so one set of keyframes
  // covers every power level — CSS can interpolate to a var, it just
  // can't take one as a steps() count.
  const reach = trick.minReach + (trick.maxReach - trick.minReach) * Math.max(0, Math.min(1, power))

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
    <div className="relative w-full" style={{ height: height * (1 + HEADROOM) }}>
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
      <div
        className="absolute"
        style={{ left: '50%', bottom: 3, width: 0, height, '--trick-reach': reach }}
      >
        {trick.layers.flatMap((layer, i) => {
          // A `repeat` layer is drawn several times, stacked, with the count
          // set by power — that's how the carry trick turns power into
          // "how many glasses he balances" rather than "how high something
          // flies".
          const count = layer.repeat
            ? Math.round(layer.repeat.min + (layer.repeat.max - layer.repeat.min) * Math.max(0, Math.min(1, power)))
            : 1
          const base = layerStyle(layer)
          return Array.from({ length: count }, (_, n) => (
            <img
              key={`${layer.src}-${i}-${n}`}
              src={ART_SRC(layer.src)}
              alt=""
              className={`absolute ${layer.className}`}
              style={{
                ...base,
                // Each one sits on the one below it.
                bottom: base.bottom + n * base.height * (layer.repeat?.overlap ?? 1),
                animationDuration: ms,
                // Stagger the wobble down the stack so it sways as one
                // piece rather than every glass moving in lockstep.
                animationDelay: layer.repeat ? `${n * 70}ms` : undefined,
                maxWidth: 'none',
                // Held on the first frame until the throw starts.
                animationPlayState: paused ? 'paused' : 'running',
                WebkitTouchCallout: 'none',
                pointerEvents: 'none',
                zIndex: 10 + n,
              }}
            />
          ))
        })}
      </div>
    </div>
  )
}
