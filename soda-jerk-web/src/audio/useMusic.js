import { useEffect, useRef, useState } from 'react'

const VOLUME_KEY = 'soda-jerk-volume'

// Plays a looping background track. Browsers (especially mobile Safari)
// block audio from autoplaying until a real user gesture happens, so
// `start()` is meant to be called from inside a click/tap handler —
// see App.jsx, which calls it on the first Controls press.
export function useMusic(src, { loop = true, volume: defaultVolume = 0.5 } = {}) {
  const audioRef = useRef(null)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(() => {
    try {
      const saved = localStorage.getItem(VOLUME_KEY)
      return saved !== null ? Number(saved) : defaultVolume
    } catch {
      return defaultVolume
    }
  })

  useEffect(() => {
    const audio = new Audio(src)
    audio.loop = loop
    audioRef.current = audio
    return () => {
      audio.pause()
      audioRef.current = null
    }
  }, [src, loop])

  // Pause when the screen locks / the tab loses visibility — audio
  // otherwise keeps playing in the background — and pick back up where
  // it left off if it was actually playing when that happened.
  useEffect(() => {
    const wasPlaying = { current: false }
    const handleVisibility = () => {
      const audio = audioRef.current
      if (!audio) return
      if (document.hidden) {
        wasPlaying.current = !audio.paused
        audio.pause()
      } else if (wasPlaying.current) {
        audio.play().catch(() => {})
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
    try {
      localStorage.setItem(VOLUME_KEY, String(volume))
    } catch {
      // private browsing etc. — fine to just skip persisting
    }
  }, [volume])

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

  return { start, stop, isMuted, toggleMute, volume, setVolume }
}
