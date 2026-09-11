import { useEffect, useRef, useState } from 'react'
import DecoButton from './DecoButton.jsx'
import TrickAnimation from './TrickAnimation.jsx'
import { trickForStage } from '../game/tricks.js'
import { TRICK_CHARGE_MS, TRICK_MAX_BONUS } from '../game/constants.js'

// Long enough to watch the trick land, and to decide how long to hold.
const AUTO_CONTINUE_SECONDS = 6
// What a player who never touches the screen gets — the trick still plays
// itself out rather than sitting frozen waiting for input.
const IDLE_POWER = 0.55

export default function StagePassedScreen({ stage, onContinue, onTrickBonus }) {
  const [secondsLeft, setSecondsLeft] = useState(AUTO_CONTINUE_SECONDS)
  const trick = trickForStage(stage)

  // 'ready' -> 'charging' -> 'thrown'. Only one throw per level.
  const [phase, setPhase] = useState('ready')
  const [charge, setCharge] = useState(0)
  const [power, setPower] = useState(IDLE_POWER)
  const [earned, setEarned] = useState(0)
  const chargeStartRef = useRef(0)
  const rafRef = useRef(null)

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

  useEffect(() => () => cancelAnimationFrame(rafRef.current), [])

  const startCharge = () => {
    if (phase !== 'ready') return
    setPhase('charging')
    chargeStartRef.current = performance.now()
    const tick = () => {
      // Ramps up and stops at full — holding longer only ever throws
      // further, never busts. The flourish is a reward, so the worst
      // outcome is a smaller one.
      const held = performance.now() - chargeStartRef.current
      setCharge(Math.min(1, held / TRICK_CHARGE_MS))
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
  }

  const release = () => {
    if (phase !== 'charging') return
    cancelAnimationFrame(rafRef.current)
    const held = performance.now() - chargeStartRef.current
    const p = Math.min(1, held / TRICK_CHARGE_MS)
    const bonus = Math.round(TRICK_MAX_BONUS * p)
    setPower(p)
    setEarned(bonus)
    setPhase('thrown')
    onTrickBonus?.(bonus)
  }

  const meter = phase === 'charging' ? charge : phase === 'thrown' ? power : 0

  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-ink/90 px-8 text-center">
      {trick && (
        // Charging is scoped to the trick itself rather than the whole
        // screen, so pressing CONTINUE doesn't also wind up a throw.
        <div
          className="flex flex-col items-center w-full"
          style={{ touchAction: 'none' }}
          onPointerDown={startCharge}
          onPointerUp={release}
          onPointerCancel={release}
          onPointerLeave={release}
        >
          {/* Remounting on throw restarts the animation from the top with
              the power that was just dialled in. */}
          <TrickAnimation
            key={phase === 'thrown' ? 'thrown' : 'idle'}
            trick={trick}
            height={165}
            power={power}
            paused={phase !== 'thrown'}
          />
          <div className="font-display text-brass/90 text-sm tracking-[0.22em] mt-1">{trick.name}</div>

          <div className="w-44 mt-3 mb-1">
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.12)' }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${meter * 100}%`,
                  background: 'linear-gradient(90deg, #C6A15B 0%, #E8C878 70%, #FCE4C4 100%)',
                  transition: phase === 'thrown' ? 'width 200ms ease-out' : 'none',
                }}
              />
            </div>
            <div className="text-cream/55 text-[11px] tracking-[0.2em] mt-2 h-4">
              {phase === 'ready' && 'HOLD TO WIND UP — LET GO TO THROW'}
              {phase === 'charging' && 'KEEP HOLDING…'}
              {phase === 'thrown' && (earned > 0 ? `NICE ONE  +${earned}` : 'NICE ONE')}
            </div>
          </div>
        </div>
      )}
      <DecoButton onPress={onContinue} subtext={`TAP TO CONTINUE · ${secondsLeft}`}>
        {`LEVEL ${stage} PASSED`}
      </DecoButton>
    </div>
  )
}
