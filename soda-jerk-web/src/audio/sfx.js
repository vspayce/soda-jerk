// One-shot sound effects. Most are synthesized on the fly so we don't
// have to ship an audio file for every little sting.
let ctx = null

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
  return ctx
}

const SIPHON_SRC = `${import.meta.env.BASE_URL}audio/siphon_spray.mp3`
const GLASS_SHATTER_SRC = `${import.meta.env.BASE_URL}audio/glass-drop-shatter-short.mp3`
const GAME_OVER_CRASH_SRC = `${import.meta.env.BASE_URL}audio/glasses-off-table-crash.mp3`

// Real recording — seltzer siphon to the face.
export function playSeltzerSpray() {
  const audio = new Audio(SIPHON_SRC)
  audio.volume = 0.8
  audio.play().catch(() => {})
}

// Real recording — a returning glass missed and hit the floor.
export function playGlassShatter() {
  const audio = new Audio(GLASS_SHATTER_SRC)
  audio.volume = 0.8
  audio.play().catch(() => {})
}

// Real recording — out of lives, the whole rack goes down.
export function playGameOverCrash() {
  const audio = new Audio(GAME_OVER_CRASH_SRC)
  audio.volume = 0.8
  audio.play().catch(() => {})
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
