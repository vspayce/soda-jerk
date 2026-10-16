import { useEffect, useRef, useState } from 'react'
import { PLAYER_X, COUNTER_HEIGHT_PX, STEP_EASE, SHOW_TURN_MS } from '../game/constants.js'
import { patronPortrait, patronHeld, patronWalkSheet, patronBack, BACK_VIEW_TYPES } from '../game/art.js'
import { PATRON_ART, PATRON_CANVAS_HEIGHT } from '../game/patronArt.js'

// Glows red once a still-walking customer gets close to the end of
// the bar, as a warning — replaces the old patience-timer bar since
// customers no longer stop and wait; they just keep coming.
const DANGER_X = PLAYER_X + 22

// Patron illustrations, one row per patronType (picked at spawn — see
// PATRON_TYPE_WEIGHTS in constants.js) and one column per drink type.
// They face left, the direction they walk in, and keep facing that way
// throughout — a served customer is shoved backwards by the drink rather
// than turning round, so nothing is ever mirrored. Their measurements live
// in patronArt.js, shared with the iOS/tvOS apps.
const PATRON_HEIGHT = 89

const PATRON_WALK_SHEETS = Object.fromEntries(
  PATRON_ART.map(({ width, ground }, patronType) => [
    patronType,
    [0, 1].map((drinkType) => ({
      src: patronWalkSheet(patronType, drinkType),
      aspectRatio: width / PATRON_CANVAS_HEIGHT,
      ground,
    })),
  ])
)

// Body movement while walking: a lean into the bar at full stride, and a
// rock from foot to foot with each step. Both scale with how fast they're
// actually going, so they ease off to upright as a step slows to a stop.
const LEAN_DEG = 3
const ROCK_DEG = 1.6

// The legs are driven by the ground covered, not by a clock: one cycle per
// `ground` of distance (in px, at PATRON_HEIGHT). The planted foot then
// stays put on the floor however the pace changes through a step — speed
// up and the legs speed up with it, slow to a stop and they settle with
// it, instead of a timer walking them on the spot or sliding the feet.
function strideOf(sheet, walked, laneWidthPx) {
  if (!laneWidthPx) return 0
  const walkedPx = (walked / 100) * laneWidthPx
  const cycles = walkedPx / (sheet.ground * PATRON_HEIGHT)
  return cycles - Math.floor(cycles) // 0..1 through the cycle
}

// `walked`, `vel`: distance walked so far and current pace (lane %, %/s),
// from the engine — see strideOf.
// `clamoring`: standing between steps, rocking toward the bar for a drink.
export default function Customer({ x, drinkType, patronType, status, drinkName, speed, vel, walked, laneWidthPx, clamoring, pauseTotalMs }) {
  const isUrgent = status === 'walking' && x <= DANGER_X
  // Coming out of the show he turns back round to the bar. The engine has
  // him on his feet and standing still for SHOW_TURN_MS; this holds the
  // portrait for that long so the turn can be seen, instead of snapping to
  // the walking sprite.
  const lastStatus = useRef(status)
  const [turningBack, setTurningBack] = useState(false)
  useEffect(() => {
    const was = lastStatus.current
    lastStatus.current = status
    if (was === 'watching' && status === 'walking') setTurningBack(true)
    else if (status !== 'walking') setTurningBack(false)
  }, [status])
  useEffect(() => {
    if (!turningBack) return undefined
    const t = setTimeout(() => setTurningBack(false), SHOW_TURN_MS)
    return () => clearTimeout(t)
  }, [turningBack])
  // Caught the drink and now sliding back from it. They keep
  // facing the bartender the whole way — they're being shoved, not walking
  // out — so there's no mirroring and no walk cycle, which is what every
  // version of the backwards-walking bug came from. A shove has no gait.
  const isLeaving = status === 'leaving-happy'
  const isToasting = status === 'toasting'
  const isDrinking = status === 'drinking'
  // Turned round to watch the dachshund's show: they turn their back on the
  // bar (see patron-turn-away in index.css), stay that way while it plays,
  // and turn back when it's done. They're standing still throughout, so the
  // portrait can simply be flipped — there's no gait to go wrong.
  const isWatching = status === 'watching'
  const hasRear = BACK_VIEW_TYPES.has(patronType)
  // The impact beat, the slide and the drink itself all show them holding
  // what they caught.
  const heldSrc = isToasting || isLeaving || isDrinking ? patronHeld(patronType, drinkType) : null
  const walkSheet = status === 'walking' ? PATRON_WALK_SHEETS[patronType]?.[drinkType] : null
  const stride = walkSheet ? strideOf(walkSheet, walked, laneWidthPx) : 0
  const frame = Math.floor(stride * 8) % 8
  // 0 standing, 1 at the top speed of a step
  const pace = speed ? Math.min(1, (vel || 0) / (speed / (1 - STEP_EASE))) : 0
  const tilt = -LEAN_DEG * pace + ROCK_DEG * Math.sin(stride * 4 * Math.PI) * pace

  return (
    <div
      className="absolute z-10 customer-emerge"
      style={{
        left: `${x}%`,
        top: `calc(50% + ${COUNTER_HEIGHT_PX / 2}px)`,
        transform: 'translate(-50%, -100%)',
        // No ghosting any more. That cue meant "already served, don't throw
        // at me", which stopped being true once a shove that falls short
        // sends them back for another drink — they're a live customer
        // again. Sliding backwards with a drink in hand says it by itself.
        filter: isUrgent ? 'drop-shadow(0 0 5px #7A1F2B)' : 'none',
        transition: 'filter 200ms',
      }}
      title={drinkName}
    >
      {heldSrc ? (
        <img
          src={heldSrc}
          alt=""
          className={isToasting ? 'patron-toast' : isDrinking ? 'patron-sip' : undefined}
          style={{
            height: PATRON_HEIGHT,
            width: 'auto',
            display: 'block',
            // Rocked back on their heels while the shove carries them.
            transform: isLeaving ? 'rotate(4deg)' : undefined,
            transformOrigin: '50% 100%',
          }}
        />
      ) : (isWatching || turningBack) && hasRear ? (
        // Seen from behind: the profile squeezes edge-on while the back of
        // the head swells out of it (or the reverse, turning back). The two
        // drawings share a canvas, so they sit exactly on top of each other.
        <div
          className={`patron-turn ${isWatching ? 'patron-turn-to-rear' : 'patron-turn-to-front'}`}
          style={{ '--turn-ms': `${SHOW_TURN_MS}ms`, position: 'relative', height: PATRON_HEIGHT }}
        >
          <img
            src={patronPortrait(patronType, drinkType)}
            alt=""
            className="patron-turn-side"
            style={{ height: PATRON_HEIGHT, width: 'auto', display: 'block' }}
          />
          <img
            src={patronBack(patronType, drinkType)}
            alt=""
            className="patron-turn-rear"
            style={{ height: PATRON_HEIGHT, width: 'auto', display: 'block', position: 'absolute', left: 0, top: 0 }}
          />
        </div>
      ) : isWatching ? (
        // No rear-view art for this patron yet: flip the portrait.
        <div className="patron-turn-away" style={{ '--turn-ms': `${SHOW_TURN_MS}ms` }}>
          <img
            src={patronPortrait(patronType, drinkType)}
            alt=""
            className="patron-watch"
            style={{ height: PATRON_HEIGHT, width: 'auto', display: 'block' }}
          />
        </div>
      ) : turningBack ? (
        <div className="patron-turn-back" style={{ '--turn-ms': `${SHOW_TURN_MS}ms` }}>
          <img
            src={patronPortrait(patronType, drinkType)}
            alt=""
            style={{ height: PATRON_HEIGHT, width: 'auto', display: 'block' }}
          />
        </div>
      ) : walkSheet ? (
        <div
          className={clamoring ? 'patron-clamor' : undefined}
          // one rock per pause, so it's upright again as the next step starts
          style={clamoring && pauseTotalMs ? { animationDuration: `${Math.round(pauseTotalMs)}ms` } : undefined}
        >
          <div
            className="patron-walk-cycle-sprite"
            style={{
              height: PATRON_HEIGHT,
              width: PATRON_HEIGHT * walkSheet.aspectRatio,
              backgroundImage: `url(${walkSheet.src})`,
              // the frame comes from the distance walked (see strideOf),
              // not from the sheet's own timed animation
              animation: 'none',
              backgroundPositionX: `${(frame / 7) * 100}%`,
              transform: `rotate(${tilt.toFixed(2)}deg)`,
              transformOrigin: '50% 100%',
            }}
          />
        </div>
      ) : (
        <div className="patron-walk">
          <img
            src={patronPortrait(patronType, drinkType)}
            alt=""
            style={{
              height: PATRON_HEIGHT,
              width: 'auto',
              display: 'block',
            }}
          />
        </div>
      )}
    </div>
  )
}
