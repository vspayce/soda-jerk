import { COUNTER_HEIGHT_PX } from '../game/constants.js'
import { ART_SRC, patronSpray } from '../game/art.js'

const STAND_SRC = ART_SRC('player-stand.png')
const THROW_SRC = ART_SRC('player-throw.png')
// 8-frame run, rigged from one PixelLab picture of him mid-stride
// (tools/patron_rig/jerk_run.py). Faces right, like his other poses.
const RUN_SHEET = ART_SRC('player-run-cycle.png')
const RUN_ASPECT = 249 / 358
const HEIGHT = 94

export default function Player({ x, spraying, sprayDrinkType, sprayPatronType, throwing, moveDir }) {
  const running = moveDir !== 0 && !throwing
  // His art faces right; running left is the same art mirrored.
  const flip = moveDir === -1 ? 'scaleX(-1)' : 'none'

  return (
    <div
      className="absolute z-20"
      style={{
        left: `${x}%`,
        top: `calc(50% + ${COUNTER_HEIGHT_PX / 2}px)`,
        transform: 'translate(-50%, -100%)',
      }}
    >
      <div className={`relative ${spraying ? 'player-flinch' : ''} ${throwing ? 'player-throw-pop' : ''}`}>
        {running ? (
          <div
            className="jerk-run-cycle-sprite"
            style={{
              height: HEIGHT,
              width: HEIGHT * RUN_ASPECT,
              backgroundImage: `url(${RUN_SHEET})`,
              transform: flip,
            }}
          />
        ) : (
          <img
            src={throwing ? THROW_SRC : STAND_SRC}
            alt=""
            style={{ height: HEIGHT, width: 'auto', display: 'block', transform: flip }}
          />
        )}
        {spraying && (
          <img
            src={patronSpray(sprayPatronType, sprayDrinkType)}
            alt=""
            className="absolute seltzer-spray"
            style={{ left: '100%', bottom: 0, marginLeft: 4, height: 97, width: 'auto' }}
          />
        )}
      </div>
    </div>
  )
}
