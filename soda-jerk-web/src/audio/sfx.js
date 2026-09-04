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
