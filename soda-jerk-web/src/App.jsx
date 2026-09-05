import { useEffect, useRef, useState } from 'react'
import { useGameEngine } from './game/useGameEngine.js'
import { useMusic } from './audio/useMusic.js'
import { playSeltzerSpray, playCelebration } from './audio/sfx.js'
import { LANE_COUNT, POINTS_PER_BONUS } from './game/constants.js'
import Lane from './components/Lane.jsx'
import HUD from './components/HUD.jsx'
import Controls from './components/Controls.jsx'
import GameOverScreen from './components/GameOverScreen.jsx'
import PerspectiveBackdrop from './components/PerspectiveBackdrop.jsx'
import SplashScreen from './components/SplashScreen.jsx'
import Celebration from './components/Celebration.jsx'
import SettingsScreen from './components/SettingsScreen.jsx'

// BASE_URL respects the vite.config.js `base` setting, so this still
// resolves correctly once deployed under /soda-jerk/ on GitHub Pages.
const MUSIC_SRC = `${import.meta.env.BASE_URL}audio/wurlitzer-loop.mp3`

// No joystick — a swipe up/down on the bar area switches lanes (one per
// gesture, re-arms on release), and dragging left/right runs the
// bartender along the counter while the drag is held.
const LANE_SWIPE_THRESHOLD = 40
const RUN_DEADZONE = 20

export default function App() {
  const {
    state,
    changeLane,
    serveOrCatch,
    startRun,
    stopRun,
    selectDrink,
    grabBonus,
    grabGlass,
    startGame,
    restart,
  } = useGameEngine()
  const music = useMusic(MUSIC_SRC, { volume: 0.22 })
  const [spraying, setSpraying] = useState(false)
  const [celebrate, setCelebrate] = useState(null)
  const [showSettings, setShowSettings] = useState(false)
  const prevSpillRef = useRef(state.spillCount)
  const prevCelebrateRef = useRef(state.celebrateCount)
  const gestureRef = useRef({ dragging: false, startX: 0, startY: 0, laneLatched: false, runDir: 0 })

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
      const t = setTimeout(() => setSpraying(false), 1100)
      return () => clearTimeout(t)
    }
  }, [state.spillCount])

  // Confetti + points celebration whenever a hot dog is grabbed.
  useEffect(() => {
    if (state.celebrateCount !== prevCelebrateRef.current) {
      prevCelebrateRef.current = state.celebrateCount
      playCelebration()
      setCelebrate(state.lastCelebrate)
      const t = setTimeout(() => setCelebrate(null), 1200)
      return () => clearTimeout(t)
    }
  }, [state.celebrateCount])

  const handleGestureStart = (e) => {
    if (!state.started || state.gameOver) return
    music.start()
    gestureRef.current = { dragging: true, startX: e.clientX, startY: e.clientY, laneLatched: false, runDir: 0 }
  }

  const handleGestureMove = (e) => {
    const g = gestureRef.current
    if (!g.dragging) return
    const dx = e.clientX - g.startX
    const dy = e.clientY - g.startY

    if (!g.laneLatched && Math.abs(dy) > LANE_SWIPE_THRESHOLD && Math.abs(dy) > Math.abs(dx)) {
      g.laneLatched = true
      changeLane(dy < 0 ? -1 : 1)
    }

    if (Math.abs(dx) > RUN_DEADZONE) {
      const dir = dx > 0 ? 1 : -1
      if (g.runDir !== dir) {
        g.runDir = dir
        startRun(dir)
      }
    } else if (g.runDir !== 0) {
      g.runDir = 0
      stopRun()
    }
  }

  const handleGestureEnd = () => {
    const g = gestureRef.current
    if (g.runDir !== 0) stopRun()
    gestureRef.current = { dragging: false, startX: 0, startY: 0, laneLatched: false, runDir: 0 }
  }

  return (
    <div
      className="phone-frame select-none relative"
      onDragStart={(e) => e.preventDefault()}
      style={{
        background:
          'radial-gradient(120% 80% at 50% 0%, #1B6F62 0%, #0E4B43 35%, #151014 100%)',
      }}
    >
      <PerspectiveBackdrop />

      <HUD
        score={state.score}
        lives={state.lives}
        isMuted={music.isMuted}
        onToggleMute={music.toggleMute}
        onOpenSettings={() => setShowSettings(true)}
      />

      <div
        className="absolute inset-0 flex flex-col justify-end gap-1 px-4 pt-28 pb-32"
        onPointerDown={handleGestureStart}
        onPointerMove={handleGestureMove}
        onPointerUp={handleGestureEnd}
        onPointerCancel={handleGestureEnd}
      >
        {Array.from({ length: LANE_COUNT }).map((_, laneIndex) => (
          <Lane
            key={laneIndex}
            isPlayerLane={state.playerLane === laneIndex}
            playerX={state.playerX}
            moveDir={state.playerLane === laneIndex ? state.moveDir : 0}
            spraying={state.playerLane === laneIndex && spraying}
            sprayDrinkType={state.lastSpillDrinkType}
            customers={state.customers.filter((c) => c.lane === laneIndex)}
            mugs={state.mugs.filter((m) => m.lane === laneIndex)}
            glasses={state.glasses.filter((g) => g.lane === laneIndex)}
            bonus={state.bonus && state.bonus.lane === laneIndex ? state.bonus : null}
            onGrabBonus={withAudio(grabBonus)}
            onGrabGlass={withAudio(grabGlass)}
          />
        ))}
      </div>

      {state.started && !state.gameOver && (
        <Controls
          onServe={withAudio(serveOrCatch)}
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

      {celebrate && <Celebration points={POINTS_PER_BONUS} />}

      {showSettings && (
        <SettingsScreen
          volume={music.volume}
          onVolumeChange={music.setVolume}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  )
}
