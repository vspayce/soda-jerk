import { useRef, useState, useCallback, useEffect } from 'react'
import * as E from './engine.js'

// The rules live in engine.js; this is the web game's React wrapper round
// them: it owns the sim, runs step() every animation frame, and hands the
// components each action already bound to the sim.
export { createInitialSim, startLevel, step, BONUS_MODES, BONUS_ROUND_MENU } from './engine.js'

const ACTIONS = [
  'changeLane',
  'goToLane',
  'pourDrink',
  'grabGlass',
  'grabBonus',
  'startRun',
  'stopRun',
  'addTrickBonus',
  'setPaused',
  'continueAfterDeath',
  'advanceStage',
  'bonusAimStart',
  'bonusAimMove',
  'bonusAimEnd',
  'plateClick',
  'shakerAimStart',
  'shakerAimMove',
  'shakerAimEnd',
  'slideFlick',
  'tempestMoveTo',
  'skipToBonusRound',
  'skipToNewVenue',
]

export function useGameEngine() {
  const simRef = useRef(E.createInitialSim())
  const lastTsRef = useRef(null)
  const rafRef = useRef(null)
  const [, setTick] = useState(0)

  useEffect(() => {
    const loop = (ts) => {
      if (lastTsRef.current == null) lastTsRef.current = ts
      const dt = Math.min((ts - lastTsRef.current) / 1000, 0.05)
      lastTsRef.current = ts
      if (!simRef.current.gameOver) E.step(simRef.current, dt)
      setTick((n) => n + 1)
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  // Every action, bound to the current sim. Built once: they read
  // simRef.current at call time, so a restart's new sim is picked up.
  const bound = useRef(null)
  if (!bound.current) {
    bound.current = Object.fromEntries(ACTIONS.map((name) => [name, (...args) => E[name](simRef.current, ...args)]))
  }

  const startGame = useCallback(() => {
    E.startGame(simRef.current)
    setTick((n) => n + 1)
  }, [])

  const restart = useCallback(() => {
    simRef.current = E.newGame()
    lastTsRef.current = null
    setTick((n) => n + 1)
  }, [])

  return { state: simRef.current, ...bound.current, startGame, restart }
}
