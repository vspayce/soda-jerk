import DecoButton from './DecoButton.jsx'

export default function StagePassedScreen({ stage, onContinue }) {
  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-ink/90 px-8 text-center">
      <DecoButton onPress={onContinue} subtext="TAP TO CONTINUE">
        {`LEVEL ${stage} PASSED`}
      </DecoButton>
    </div>
  )
}
