import { useEffect, useRef, useState } from 'react'
import { useGameEngine } from './game/useGameEngine.js'
import { useMusic } from './audio/useMusic.js'
import { playSeltzerSpray, playCelebration } from './audio/sfx.js'
import { LANE_COUNT } from './game/constants.js'
import Lane from './components/Lane.jsx'
import HUD from './components/HUD.jsx'
import Controls from './components/Controls.jsx'
import GameOverScreen from './components/GameOverScreen.jsx'
import PerspectiveBackdrop from './components/PerspectiveBackdrop.jsx'
import SplashScreen from './components/SplashScreen.jsx'

// BASE_URL respects the vite.config.js `base` setting, so this still
// resolves correctly once deployed under /soda-jerk/ on GitHub Pages.
const MUSIC_SRC = `${import.meta.env.BASE_URL}audio/wurlitzer-loop.mp3`

export default function App() {
  const { state, changeLane, serveOrCatch, startRun, stopRun, selectDrink, startGame, restart } = useGameEngine()
  const music = useMusic(MUSIC_SRC, { volume: 0.45 })
  const [spraying, setSpraying] = useState(false)
  const [celebrate, setCelebrate] = useState(null)
  const prevSpillRef = useRef(state.spillCount)
  const prevCelebrateRef = useRef(state.celebrateCount)

  // Wrap each control so the very first tap also starts the music —
  // satisfies the browser's "needs a real user gesture" rule for audio.
  const withAudio = (fn) => (...args) => {
    music.start()
    fn(...args)
  }

  // The fountain's closed once the game ends — cut the music with it.
  useEffect(() => {
    if (state.gameOver) music.stop()
  }, [state.gameOver])

  // Seltzer in the face whenever an unserved customer reaches the end of
  // the bar in the player's own lane.
  useEffect(() => {
    if (state.spillCount !== prevSpillRef.current) {
      prevSpillRef.current = state.spillCount
      playSeltzerSpray()
      setSpraying(true)
      const t = setTimeout(() => setSpraying(false), 550)
      return () => clearTimeout(t)
    }
  }, [state.spillCount])

  // Confetti + points celebration whenever a hot dog is grabbed.
  useEffect(() => {
    if (state.celebrateCount !== prevCelebrateRef.current) {
      prevCelebrateRef.current = state.celebrateCount
      playCelebration()
      setCelebrate(state.lastCelebrate)
      const t = setTimeout(() => setCelebrate(null), 800)
      return () => clearTimeout(t)
    }
  }, [state.celebrateCount])

  return (
    <div
      className="phone-frame select-none relative"
      style={{
        background:
          'radial-gradient(120% 80% at 50% 0%, #1B6F62 0%, #0E4B43 35%, #151014 100%)',
      }}
    >
      <PerspectiveBackdrop />

      <HUD score={state.score} lives={state.lives} isMuted={music.isMuted} onToggleMute={music.toggleMute} />

      <div className="absolute inset-0 flex flex-col justify-end gap-4 px-4 pt-28 pb-32">
        {Array.from({ length: LANE_COUNT }).map((_, laneIndex) => (
          <Lane
            key={laneIndex}
            isPlayerLane={state.playerLane === laneIndex}
            playerX={state.playerX}
            spraying={state.playerLane === laneIndex && spraying}
            customers={state.customers.filter((c) => c.lane === laneIndex)}
            mugs={state.mugs.filter((m) => m.lane === laneIndex)}
            glasses={state.glasses.filter((g) => g.lane === laneIndex)}
            bonus={state.bonus && state.bonus.lane === laneIndex ? state.bonus : null}
            celebrate={celebrate && celebrate.lane === laneIndex ? celebrate : null}
          />
        ))}
      </div>

      {state.started && !state.gameOver && (
        <Controls
          onUp={withAudio(() => changeLane(-1))}
          onDown={withAudio(() => changeLane(1))}
          onServe={withAudio(serveOrCatch)}
          onRunStart={withAudio(startRun)}
          onRunStop={stopRun}
          selectedDrink={state.selectedDrink}
          onSelectDrink={withAudio(selectDrink)}
        />
      )}

      {state.started && state.gameOver && (
        <GameOverScreen score={state.score} onRestart={withAudio(restart)} />
      )}

      {!state.started && (
        <SplashScreen
          onStart={() => {
            music.start()
            startGame()
          }}
        />
      )}
    </div>
  )
}
