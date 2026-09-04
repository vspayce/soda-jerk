import { useEffect, useRef, useState } from 'react'

// Plays a looping background track. Browsers (especially mobile Safari)
// block audio from autoplaying until a real user gesture happens, so
// `start()` is meant to be called from inside a click/tap handler —
// see App.jsx, which calls it on the first Controls press.
export function useMusic(src, { loop = true, volume = 0.5 } = {}) {
  const audioRef = useRef(null)
  const [isMuted, setIsMuted] = useState(false)

  useEffect(() => {
    const audio = new Audio(src)
    audio.loop = loop
    audio.volume = volume
    audioRef.current = audio
    return () => {
      audio.pause()
      audioRef.current = null
    }
  }, [src, loop, volume])

  const start = () => {
    const audio = audioRef.current
    if (!audio || !audio.paused) return
    audio.play().catch(() => {
      // Blocked by the browser — will succeed on the next user gesture.
    })
  }

  const stop = () => {
    const audio = audioRef.current
    if (!audio) return
    audio.pause()
    audio.currentTime = 0
  }

  const toggleMute = () => {
    const audio = audioRef.current
    if (!audio) return
    audio.muted = !audio.muted
    setIsMuted(audio.muted)
  }

  return { start, stop, isMuted, toggleMute }
}
