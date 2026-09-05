import DecoButton from './DecoButton.jsx'

const SPRAY_SRC = `${import.meta.env.BASE_URL}art/spray-closeup.png`
const BROKEN_GLASS_SRC = `${import.meta.env.BASE_URL}art/broken-glass.png`

export default function LifeLostScreen({ score, lives, missReason, onContinue }) {
  const image = missReason === 'spray' ? SPRAY_SRC : missReason === 'glass' ? BROKEN_GLASS_SRC : null
  const title = missReason === 'glass' ? 'YOU MISSED A GLASS!' : missReason === 'spray' ? 'YOU GOT SPRAYED!' : null
  const subtext = `SCORE ${score} · ${lives} ${lives === 1 ? 'LIFE' : 'LIVES'} LEFT`

  if (!image) {
    return (
      <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-ink/90 px-8 text-center">
        <DecoButton onPress={onContinue} subtext={subtext}>
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
      <div className="mt-4 text-brass text-sm tracking-[0.2em] underline underline-offset-4">TAP TO CONTINUE</div>
    </button>
  )
}
