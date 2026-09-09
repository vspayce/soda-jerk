import { useEffect, useRef, useState } from 'react'
import DecoButton from './DecoButton.jsx'

const SPRAY_SRC = `${import.meta.env.BASE_URL}art/spray-closeup.png`
const BROKEN_GLASS_SRC = `${import.meta.env.BASE_URL}art/broken-glass.png`
const SPILLED_MILKSHAKE_SRC = `${import.meta.env.BASE_URL}art/spilled-milkshake.png`
const AUTO_CONTINUE_SECONDS = 3

export default function LifeLostScreen({ score, lives, missReason, onContinue }) {
  const [secondsLeft, setSecondsLeft] = useState(AUTO_CONTINUE_SECONDS)
  // onContinue is re-created every render upstream (wrapped in withAudio),
  // so the auto-continue timer reads it from a ref instead of depending on
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

  const isBrokenGlass = missReason === 'glass' || missReason === 'mug'
  const image =
    missReason === 'spray' ? SPRAY_SRC
    : missReason === 'no-patron' ? SPILLED_MILKSHAKE_SRC
    : isBrokenGlass ? BROKEN_GLASS_SRC
    : null
  const title =
    missReason === 'glass' ? 'YOU MISSED A GLASS!'
    : missReason === 'mug' ? 'WRONG DRINK!'
    : missReason === 'no-patron' ? 'NO PATRON!'
    : missReason === 'spray' ? 'YOU GOT SPRAYED!'
    : null
  const subtext = `SCORE ${score} · ${lives} ${lives === 1 ? 'LIFE' : 'LIVES'} LEFT`

  if (!image) {
    return (
      <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-ink/90 px-8 text-center">
        <DecoButton onPress={onContinue} subtext={`${subtext} · CONTINUING IN ${secondsLeft}`}>
          YOU MISSED
        </DecoButton>
      </div>
    )
  }

  return (
    <button
      onPointerDown={(e) => {
        e.preventDefault()
        onContinue()
      }}
      className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-ink/90 px-8 text-center select-none"
    >
      {title && (
        <div className="font-display text-brass text-2xl mb-4 tracking-wide">{title}</div>
      )}
      <img
        src={image}
        alt=""
        className="max-h-[45vh] w-auto object-contain"
        style={{ borderRadius: 8, boxShadow: '0 8px 30px rgba(0,0,0,0.6)' }}
      />
      <div className="mt-6 text-cream/70 text-xs tracking-[0.25em]">{subtext}</div>
      <div className="mt-4 text-brass text-sm tracking-[0.2em] underline underline-offset-4">
        TAP TO CONTINUE · {secondsLeft}
      </div>
    </button>
  )
}
