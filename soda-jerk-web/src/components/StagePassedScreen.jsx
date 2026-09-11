import { useEffect, useRef, useState } from 'react'
import DecoButton from './DecoButton.jsx'
import TrickAnimation from './TrickAnimation.jsx'
import { trickForStage } from '../game/tricks.js'

// Long enough to actually watch the trick land before the screen moves on
// — the flourish is the reward for clearing the level, so it shouldn't be
// cut off by the auto-advance.
const AUTO_CONTINUE_SECONDS = 5

export default function StagePassedScreen({ stage, onContinue }) {
  const [secondsLeft, setSecondsLeft] = useState(AUTO_CONTINUE_SECONDS)
  const trick = trickForStage(stage)
  // onContinue is re-created every render upstream (wrapped in withAudio),
  // so the auto-advance timer reads it from a ref instead of depending on
  // it directly — otherwise the timer would restart on every parent
  // re-render and never fire.
  const onContinueRef = useRef(onContinue)
  onContinueRef.current = onContinue

  useEffect(() => {
    const timer = setTimeout(() => onContinueRef.current(), AUTO_CONTINUE_SECONDS * 1000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (secondsLeft <= 1) return
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [secondsLeft])

  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-ink/90 px-8 text-center">
      {trick && (
        <>
          <TrickAnimation trick={trick} height={165} />
          <div className="font-display text-brass/90 text-sm tracking-[0.22em] mt-1 mb-5">
            {trick.name}
          </div>
        </>
      )}
      <DecoButton onPress={onContinue} subtext={`TAP TO CONTINUE · ${secondsLeft}`}>
        {`LEVEL ${stage} PASSED`}
      </DecoButton>
    </div>
  )
}
