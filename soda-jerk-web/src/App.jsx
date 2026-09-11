import { useEffect, useRef, useState } from 'react'
import { useGameEngine } from './game/useGameEngine.js'
import { useMusic } from './audio/useMusic.js'
import { playSeltzerSpray, playCelebration, playGlassShatter, playCrash } from './audio/sfx.js'
import { LANE_COUNT, POINTS_PER_BONUS } from './game/constants.js'
import Lane from './components/Lane.jsx'
import HUD from './components/HUD.jsx'
import Controls from './components/Controls.jsx'
import GameOverScreen from './components/GameOverScreen.jsx'
import LifeLostScreen from './components/LifeLostScreen.jsx'
import StagePassedScreen from './components/StagePassedScreen.jsx'
import BonusLevel from './components/BonusLevel.jsx'
import PlatesLevel from './components/PlatesLevel.jsx'
import ShakerLevel from './components/ShakerLevel.jsx'
import SlideLevel from './components/SlideLevel.jsx'
import TempestLevel from './components/TempestLevel.jsx'
import LeaderboardScreen from './components/LeaderboardScreen.jsx'
import PerspectiveBackdrop from './components/PerspectiveBackdrop.jsx'
import SplashScreen from './components/SplashScreen.jsx'
import Celebration from './components/Celebration.jsx'
import LingoScreen from './components/LingoScreen.jsx'
import SettingsScreen from './components/SettingsScreen.jsx'
import InstructionsScreen from './components/InstructionsScreen.jsx'

// BASE_URL respects the vite.config.js `base` setting, so this still
// resolves correctly once deployed under /soda-jerk/ on GitHub Pages.
const MUSIC_SRC = `${import.meta.env.BASE_URL}audio/wurlitzer-loop.mp3`

// No joystick — tap a lane to jump straight to it, swipe up/down to move
// one lane at a time, and drag left/right to run the bartender along the
// counter while the drag is held.
const LANE_SWIPE_THRESHOLD = 40
const RUN_DEADZONE = 20

export default function App() {
  const {
    state,
    changeLane,
    goToLane,
    pourDrink,
    startRun,
    stopRun,
    setPaused,
    addTrickBonus,
    grabBonus,
    grabGlass,
    startGame,
    restart,
    continueAfterDeath,
    advanceStage,
    bonusAimStart,
    bonusAimMove,
    bonusAimEnd,
    plateClick,
    shakerAimStart,
    shakerAimMove,
    shakerAimEnd,
    skipToBonusWheel,
    skipToBonusPlates,
    skipToBonusShaker,
    skipToBonusSlide,
    slideFlick,
    skipToBonusTempest,
    tempestMoveTo,
    skipToNewVenue,
  } = useGameEngine()
  const music = useMusic(MUSIC_SRC, { volume: 0.22 })
  const [spraying, setSpraying] = useState(false)
  const [celebrate, setCelebrate] = useState(null)
  const [showSettings, setShowSettings] = useState(false)
  // The settings menu opens straight over live play, so the sim has to
  // freeze with it — otherwise patrons keep walking (and reaching the end
  // of the bar) while the player is reading the menu.
  const openSettings = () => { setPaused(true); setShowSettings(true) }
  const closeSettings = () => { setShowSettings(false); setPaused(false) }
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)
  const [showLingo, setShowLingo] = useState(false)
  const prevSpillRef = useRef(state.spillCount)
  const prevCelebrateRef = useRef(state.celebrateCount)
  const prevMissedGlassRef = useRef(state.missedGlassCount)
  const prevMugCrashRef = useRef(state.mugCrashCount)
  const prevBonusResultRef = useRef(null)
  const prevPlatePopRef = useRef(0)
  const prevPlatesResultRef = useRef(null)
  const prevShakerResolvedRef = useRef(0)
  const prevExtraLifeRef = useRef(0)
  const [extraLife, setExtraLife] = useState(false)
  const gestureRef = useRef({ dragging: false, startX: 0, startY: 0, laneLatched: false, runDir: 0 })

  // Wrap each control so the very first tap also starts the music —
  // satisfies the browser's "needs a real user gesture" rule for audio.
  const withAudio = (fn) => (...args) => {
    music.start()
    fn(...args)
  }

  // The fountain's closed once the game ends — cut the music with it.
  useEffect(() => {
    if (state.gameOver) {
      music.stop()
      playCrash()
    }
  }, [state.gameOver])

  // A glass shatters whenever one slides off the counter uncaught.
  useEffect(() => {
    if (state.missedGlassCount !== prevMissedGlassRef.current) {
      prevMissedGlassRef.current = state.missedGlassCount
      playGlassShatter()
    }
  }, [state.missedGlassCount])

  // A thrown mug crashes whenever it sails past with no one to catch it.
  useEffect(() => {
    if (state.mugCrashCount !== prevMugCrashRef.current) {
      prevMugCrashRef.current = state.mugCrashCount
      playGlassShatter()
    }
  }, [state.mugCrashCount])

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
      const t = setTimeout(() => setCelebrate(null), 10000)
      return () => clearTimeout(t)
    }
  }, [state.celebrateCount])

  // A cheerful sting when a throw lands in a cup during the bonus round.
  useEffect(() => {
    const resultText = state.bonusLevel?.resultText ?? null
    if (resultText && resultText !== prevBonusResultRef.current && resultText.startsWith('HIT')) {
      playCelebration()
    }
    prevBonusResultRef.current = resultText
  }, [state.bonusLevel?.resultText])

  // A little chime each time a dirty/dollar plate gets sprayed.
  useEffect(() => {
    const popCount = state.platesLevel?.popCount ?? 0
    if (popCount !== prevPlatePopRef.current) {
      prevPlatePopRef.current = popCount
      playCelebration()
    }
  }, [state.platesLevel?.popCount])

  // A crash the instant a clean plate gets sprayed by mistake, ending
  // the round — no sound for the normal "time's up" ending.
  useEffect(() => {
    const resultText = state.platesLevel?.resultText ?? null
    if (resultText && resultText !== prevPlatesResultRef.current && resultText !== "TIME'S UP!") {
      playGlassShatter()
    }
    prevPlatesResultRef.current = resultText
  }, [state.platesLevel?.resultText])

  // A cheerful sting when a shaker throw lands — silent on a miss, same
  // as the wheel round.
  useEffect(() => {
    const resolvedCount = state.shakerLevel?.resolvedCount ?? 0
    if (resolvedCount !== prevShakerResolvedRef.current) {
      prevShakerResolvedRef.current = resolvedCount
      if (state.shakerLevel?.resultKind === 'hit') playCelebration()
    }
  }, [state.shakerLevel?.resolvedCount])

  // An extra life every 10,000 points — worth announcing, since the lives
  // badge ticking up on its own is easy to miss mid-round.
  useEffect(() => {
    if (state.extraLifeCount !== prevExtraLifeRef.current) {
      prevExtraLifeRef.current = state.extraLifeCount
      if (state.extraLifeCount > 0) {
        playCelebration()
        setExtraLife(true)
        const t = setTimeout(() => setExtraLife(false), 2200)
        return () => clearTimeout(t)
      }
    }
  }, [state.extraLifeCount])

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

  const handleGestureEnd = (e, cancelled = false) => {
    const g = gestureRef.current
    if (!g.dragging) return
    if (g.runDir !== 0) {
      stopRun()
    } else if (!cancelled && !g.laneLatched) {
      // Never swiped or dragged — a plain tap on a lane jumps straight
      // to it, no need to swipe through the ones in between.
      const laneEl = e.target.closest('[data-lane-index]')
      if (laneEl) goToLane(Number(laneEl.dataset.laneIndex))
    }
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
      <PerspectiveBackdrop stage={state.stage} />

      <HUD
        score={state.score}
        lives={state.lives}
        isMuted={music.isMuted}
        onToggleMute={music.toggleMute}
        onOpenSettings={openSettings}
      />

      {state.mode === 'bar' && (
        <div
          className="absolute inset-0 flex flex-col justify-end gap-1 px-4 pt-28 pb-32"
          onPointerDown={handleGestureStart}
          onPointerMove={handleGestureMove}
          onPointerUp={handleGestureEnd}
          onPointerCancel={(e) => handleGestureEnd(e, true)}
        >
          {Array.from({ length: LANE_COUNT }).map((_, laneIndex) => (
            <Lane
              key={laneIndex}
              laneIndex={laneIndex}
              isPlayerLane={state.playerLane === laneIndex}
              playerX={state.playerX}
              moveDir={state.playerLane === laneIndex ? state.moveDir : 0}
              spraying={state.playerLane === laneIndex && spraying}
              sprayDrinkType={state.lastSpillDrinkType}
              sprayPatronType={state.lastSpillPatronType}
              throwing={state.playerLane === laneIndex && state.throwingMs > 0}
              customers={state.customers.filter((c) => c.lane === laneIndex)}
              mugs={state.mugs.filter((m) => m.lane === laneIndex)}
              glasses={state.glasses.filter((g) => g.lane === laneIndex)}
              bonus={state.bonus && state.bonus.lane === laneIndex ? state.bonus : null}
              onGrabBonus={withAudio(grabBonus)}
              onGrabGlass={withAudio(grabGlass)}
            />
          ))}
        </div>
      )}

      {state.mode === 'bonusWheel' && state.bonusLevel && (
        <BonusLevel
          bonusLevel={state.bonusLevel}
          onAimStart={withAudio(bonusAimStart)}
          onAimMove={bonusAimMove}
          onAimEnd={bonusAimEnd}
        />
      )}

      {state.mode === 'bonusPlates' && state.platesLevel && (
        <PlatesLevel platesLevel={state.platesLevel} onPlateClick={withAudio(plateClick)} />
      )}

      {state.mode === 'bonusSlide' && state.slideLevel && (

        <SlideLevel slideLevel={state.slideLevel} onFlick={withAudio(slideFlick)} />
      )}

      {state.mode === 'bonusTempest' && state.tempestLevel && (
        <TempestLevel tempestLevel={state.tempestLevel} onMoveTo={withAudio(tempestMoveTo)} />
      )}


      {state.mode === 'bonusShaker' && state.shakerLevel && (
        <ShakerLevel
          shakerLevel={state.shakerLevel}
          onAimStart={withAudio(shakerAimStart)}
          onAimMove={shakerAimMove}
          onAimEnd={shakerAimEnd}
        />
      )}

      {state.mode === 'bar' && state.started && !state.gameOver && !state.awaitingContinue && !state.awaitingStageAdvance && (
        <Controls
          selectedDrink={state.selectedDrink}
          onSelectDrink={withAudio(pourDrink)}
        />
      )}

      {state.mode === 'bar' && state.started && !state.gameOver && state.awaitingContinue && (
        <LifeLostScreen
          score={state.score}
          lives={state.lives}
          missReason={state.missReason}
          onContinue={withAudio(continueAfterDeath)}
        />
      )}

      {state.mode === 'bar' && state.started && !state.gameOver && !state.awaitingContinue && state.awaitingStageAdvance && (
        <StagePassedScreen
          stage={state.stage}
          onContinue={withAudio(advanceStage)}
          onTrickBonus={addTrickBonus}
        />
      )}

      {state.started && state.gameOver && (
        <GameOverScreen
          score={state.score}
          onRestart={withAudio(() => {
            // restart() hands back a brand-new sim with these counters
            // reset to 0 — without this, the refs below would still hold
            // the old game's last values, and the very next render would
            // see a mismatch and immediately replay whichever effect
            // fired last (usually the spray).
            prevSpillRef.current = 0
            prevCelebrateRef.current = 0
            prevMissedGlassRef.current = 0
            prevMugCrashRef.current = 0
            restart()
          })}
          onShowLingo={() => setShowLingo(true)}
        />
      )}

      {!state.started && (
        <SplashScreen
          onStart={() => {
            music.start()
            setShowInstructions(true)
          }}
          onShowLeaderboard={() => setShowLeaderboard(true)}
        />
      )}

      {!state.started && showInstructions && (
        <InstructionsScreen
          onContinue={() => {
            setShowInstructions(false)
            startGame()
          }}
          onShowLingo={() => setShowLingo(true)}
        />
      )}

      {!state.started && showLeaderboard && <LeaderboardScreen onClose={() => setShowLeaderboard(false)} />}

      {celebrate && <Celebration points={POINTS_PER_BONUS} />}

      {showSettings && (
        <SettingsScreen
          volume={music.volume}
          onVolumeChange={music.setVolume}
          onClose={closeSettings}
          onShowLingo={() => setShowLingo(true)}
          onSkipToBonusWheel={
            state.started && !state.gameOver && state.mode === 'bar'
              ? withAudio(() => {
                  closeSettings()
                  skipToBonusWheel()
                })
              : null
          }
          onSkipToBonusPlates={
            state.started && !state.gameOver && state.mode === 'bar'
              ? withAudio(() => {
                  closeSettings()
                  skipToBonusPlates()
                })
              : null
          }
          onSkipToBonusShaker={
            state.started && !state.gameOver && state.mode === 'bar'
              ? withAudio(() => {
                  closeSettings()
                  skipToBonusShaker()
                })
              : null
          }
          onSkipToBonusSlide={
            state.started && !state.gameOver && state.mode === 'bar'
              ? withAudio(() => {
                  closeSettings()
                  skipToBonusSlide()
                })
              : null
          }
          onSkipToBonusTempest={
            state.started && !state.gameOver && state.mode === 'bar'
              ? withAudio(() => {
                  closeSettings()
                  skipToBonusTempest()
                })
              : null
          }
          onSkipToNewVenue={
            state.started && !state.gameOver && state.mode === 'bar' && state.stage < 2
              ? withAudio(() => {
                  closeSettings()
                  skipToNewVenue()
                })
              : null
          }
        />
      )}

      {/* Sits above the settings panel it can be opened from, so closing
          it drops the player back to settings rather than out of it. */}
      {extraLife && (
        <div className="absolute inset-x-0 flex justify-center pointer-events-none" style={{ top: '32%', zIndex: 70 }}>
          <div
            className="px-5 py-2 rounded-lg font-display text-xl tracking-[0.18em]"
            style={{
              background: 'rgba(12,10,13,0.85)',
              border: '1px solid rgba(232,200,120,0.6)',
              color: '#F2D58C',
              boxShadow: '0 6px 24px rgba(0,0,0,0.6)',
            }}
          >
            EXTRA LIFE
          </div>
        </div>
      )}

      {showLingo && <LingoScreen onClose={() => setShowLingo(false)} />}
    </div>
  )
}
