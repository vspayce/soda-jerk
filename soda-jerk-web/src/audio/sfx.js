// One-shot sound effects, synthesized on the fly (filtered white noise)
// instead of shipping audio files for every little sting.
let ctx = null

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
  return ctx
}

// A short fizzy hiss — seltzer siphon to the face.
export function playSeltzerSpray() {
  const audioCtx = getCtx()
  if (audioCtx.state === 'suspended') audioCtx.resume()

  const duration = 0.45
  const bufferSize = Math.floor(audioCtx.sampleRate * duration)
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize)
  }

  const noise = audioCtx.createBufferSource()
  noise.buffer = buffer

  const bandpass = audioCtx.createBiquadFilter()
  bandpass.type = 'bandpass'
  bandpass.frequency.value = 4200
  bandpass.Q.value = 0.5

  const gain = audioCtx.createGain()
  gain.gain.setValueAtTime(0.55, audioCtx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration)

  noise.connect(bandpass)
  bandpass.connect(gain)
  gain.connect(audioCtx.destination)

  noise.start()
  noise.stop(audioCtx.currentTime + duration)
}

// A quick cheerful arpeggio — hot dog grabbed.
export function playCelebration() {
  const audioCtx = getCtx()
  if (audioCtx.state === 'suspended') audioCtx.resume()

  const notes = [523.25, 659.25, 783.99, 1046.5] // C5 E5 G5 C6
  notes.forEach((freq, i) => {
    const start = audioCtx.currentTime + i * 0.07
    const osc = audioCtx.createOscillator()
    osc.type = 'triangle'
    osc.frequency.value = freq

    const gain = audioCtx.createGain()
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(0.3, start + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.22)

    osc.connect(gain)
    gain.connect(audioCtx.destination)
    osc.start(start)
    osc.stop(start + 0.24)
  })
}
