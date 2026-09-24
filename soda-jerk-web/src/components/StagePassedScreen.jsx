import { useEffect, useRef, useState } from 'react'
import DecoButton from './DecoButton.jsx'
import TrickAnimation from './TrickAnimation.jsx'
import { trickForClear } from '../game/tricks.js'
import { TRICK_BONUS } from '../game/constants.js'

// Long enough to watch the trick land.
const AUTO_CONTINUE_SECONDS = 5
// A beat on the pose before he throws, so the screen has settled and the
// throw reads as the payoff rather than something already under way.
const THROW_DELAY_MS = 450

export default function StagePassedScreen({ clearCount, onContinue, onTrickBonus }) {
  const [secondsLeft, setSecondsLeft] = useState(AUTO_CONTINUE_SECONDS)
  const [thrown, setThrown] = useState(false)
  const trick = trickForClear(clearCount)

  const onContinueRef = useRef(onContinue)
  onContinueRef.current = onContinue
  const onTrickBonusRef = useRef(onTrickBonus)
  onTrickBonusRef.current = onTrickBonus
  // StrictMode runs mount effects twice in development; the bonus must
  // only ever be paid once per level.
  const paidRef = useRef(false)

  useEffect(() => {
    const timer = setTimeout(() => onContinueRef.current(), AUTO_CONTINUE_SECONDS * 1000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (secondsLeft <= 1) return
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [secondsLeft])

  // The trick plays itself — passing the level is the achievement, the
  // flourish is just him celebrating it, so there's nothing to hold.
  useEffect(() => {
    if (!trick) return
    const t = setTimeout(() => {
      setThrown(true)
      if (!paidRef.current) {
        paidRef.current = true
        onTrickBonusRef.current?.(TRICK_BONUS)
      }
    }, THROW_DELAY_MS)
    return () => clearTimeout(t)
  }, [trick])

  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-ink/90 px-8 text-center">
      {trick && (
        <div className="flex flex-col items-center w-full">
          {/* Remounting on throw restarts the animation from the top. */}
          <TrickAnimation key={thrown ? 'thrown' : 'idle'} trick={trick} height={165} power={1} paused={!thrown} />
          <div className="font-display text-brass/90 text-sm tracking-[0.22em] mt-1">{trick.name}</div>
          <div className="text-cream/55 text-[11px] tracking-[0.2em] mt-2 mb-3 h-4">
            {thrown && `NICE ONE  +${TRICK_BONUS}`}
          </div>
        </div>
      )}
      <DecoButton onPress={onContinue} subtext={`TAP TO CONTINUE · ${secondsLeft}`}>
        {/* The level you just passed is how many clean clears you've made,
            NOT sim.stage. Stage is the lane-capacity tier and deliberately
            caps at STAGE_LANE_CAPACITY.length (3) — past that every clear
            leads into a bonus round instead of another tier, so showing
            stage here froze the screen on "LEVEL 3 PASSED" no matter how
            many more levels you cleared. */}
        {`LEVEL ${clearCount} PASSED`}
      </DecoButton>
    </div>
  )
}
