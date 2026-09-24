import { useEffect, useState } from 'react'
import TrickAnimation from './TrickAnimation.jsx'
import { trickForClear } from '../game/tricks.js'
import { COUNTER_HEIGHT_PX, TRICK_THROW_DELAY_MS } from '../game/constants.js'

// The jerk celebrating a passed level, right where he stands on the bar —
// drawn in place of his usual sprite (see Lane.jsx), at the same size and
// on the same footing, so it's him doing the trick rather than a picture
// of him on a separate screen. StagePassedScreen pays the bonus on the
// same beat.
const HEIGHT = 94 // same as Player.jsx

export default function LevelPassTrick({ clearCount, x }) {
  const trick = trickForClear(clearCount)
  const [thrown, setThrown] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setThrown(true), TRICK_THROW_DELAY_MS)
    return () => clearTimeout(t)
  }, [])
  if (!trick) return null
  return (
    <div
      // above every lane, so a high throw can fly up over the bars above his
      className="absolute z-30 pointer-events-none"
      style={{
        left: `${x}%`,
        top: `calc(50% + ${COUNTER_HEIGHT_PX / 2}px)`,
        width: 240,
        transform: 'translate(-50%, -100%)',
      }}
    >
      {/* Remounting on throw restarts the animation from the top. */}
      <TrickAnimation
        key={thrown ? 'thrown' : 'idle'}
        trick={trick}
        height={HEIGHT}
        power={1}
        paused={!thrown}
        floor={false}
      />
    </div>
  )
}
