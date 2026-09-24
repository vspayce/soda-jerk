import { useEffect, useRef, useState } from 'react'
import DecoButton from './DecoButton.jsx'
import { trickForClear } from '../game/tricks.js'
import { TRICK_BONUS, TRICK_THROW_DELAY_MS } from '../game/constants.js'

// Long enough to watch the trick land.
const AUTO_CONTINUE_SECONDS = 5

// The LEVEL PASSED banner. The trick itself plays on the bar, where the
// jerk is standing (LevelPassTrick.jsx), so this leaves the scene visible
// and sits low over the drink taps, which aren't needed while it's up.
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

  // Paid on the same beat he throws — passing the level is the
  // achievement, the flourish is just him celebrating it.
  useEffect(() => {
    if (!trick) return
    const t = setTimeout(() => {
      setThrown(true)
      if (!paidRef.current) {
        paidRef.current = true
        onTrickBonusRef.current?.(TRICK_BONUS)
      }
    }, TRICK_THROW_DELAY_MS)
    return () => clearTimeout(t)
  }, [trick])

  return (
    <div
      className="absolute inset-x-0 bottom-0 z-40 flex flex-col items-center px-8 pb-10 pt-16 text-center"
      style={{ background: 'linear-gradient(to bottom, transparent 0%, rgba(20,14,12,0.88) 45%)' }}
    >
      {trick && (
        <div className="mb-3">
          <div className="font-display text-brass/90 text-sm tracking-[0.22em]">{trick.name}</div>
          <div className="text-cream/60 text-[11px] tracking-[0.2em] mt-1 h-4">
            {thrown && `NICE ONE  +${TRICK_BONUS}`}
          </div>
        </div>
      )}
      <DecoButton onPress={onContinue} subtext={`TAP TO CONTINUE · ${secondsLeft}`}>
        {/* The level you just passed is how many you've passed, NOT
            sim.stage — stage is the venue and stops at STAGE_COUNT. */}
        {`LEVEL ${clearCount} PASSED`}
      </DecoButton>
    </div>
  )
}
