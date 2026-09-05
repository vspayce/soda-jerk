import DecoButton from './DecoButton.jsx'

export default function LifeLostScreen({ score, lives, onContinue }) {
  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-ink/90 px-8 text-center">
      <DecoButton onPress={onContinue} subtext={`SCORE ${score} · ${lives} ${lives === 1 ? 'LIFE' : 'LIVES'} LEFT`}>
        YOU DIED
      </DecoButton>
    </div>
  )
}
