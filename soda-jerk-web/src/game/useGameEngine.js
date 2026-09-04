import { useRef, useState, useCallback, useEffect } from 'react'
import * as C from './constants'

function lerp(a, b, t) {
  return a + (b - a) * t
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min)
}

function createInitialSim() {
  return {
    started: false,
    playerLane: 0,
    playerX: C.PLAYER_X,
    moveDir: 0, // -1 left, 0 still, 1 right — set by holding a run button
    selectedDrink: 0, // index into C.DRINK_TYPES — what the next mug pours
    lives: C.STARTING_LIVES,
    score: 0,
    survivalMs: 0,
    gameOver: false,
    customers: [],
    mugs: [],
    glasses: [],
    bonus: null,
    spillCount: 0, // bumped whenever an unserved customer reaches the end
    // of the bar in the player's own lane — App.jsx watches this to fire
    // the seltzer-in-the-face reaction.
    nextSpawnInMs: C.SPAWN_INTERVAL_START_MS,
    nextBonusInMs: randomBetween(C.BONUS_SPAWN_INTERVAL_MIN_MS, C.BONUS_SPAWN_INTERVAL_MAX_MS),
    nextId: 1,
  }
}

function difficultyFactor(survivalMs) {
  return Math.min(survivalMs / 1000 / C.RAMP_SECONDS, 1)
}

function loseLife(sim, n = 1) {
  sim.lives -= n
  if (sim.lives <= 0) {
    sim.lives = 0
    sim.gameOver = true
  }
}

function trySpawnCustomer(sim, travelMs) {
  // Cap one active (still walking) customer per lane, so arrivals stay
  // readable in the prototype.
  const busyLanes = new Set(sim.customers.filter((c) => c.status === 'walking').map((c) => c.lane))
  const openLanes = []
  for (let i = 0; i < C.LANE_COUNT; i++) if (!busyLanes.has(i)) openLanes.push(i)
  if (openLanes.length === 0) return

  const lane = pick(openLanes)
  const speed = (C.OFFSCREEN_X - C.END_OF_BAR_X) / (travelMs / 1000)
  const drinkType = Math.floor(Math.random() * C.DRINK_TYPES.length)

  sim.customers.push({
    id: sim.nextId++,
    lane,
    x: C.OFFSCREEN_X,
    status: 'walking', // walking -> leaving-happy (served) | removed (reached end of bar)
    speed,
    drinkType,
    drinkName: C.DRINK_TYPES[drinkType].name,
    color: C.DRINK_TYPES[drinkType].color,
  })
}

function step(sim, dt) {
  if (!sim.started) return

  sim.survivalMs += dt * 1000
  const t = difficultyFactor(sim.survivalMs)
  const spawnInterval = lerp(C.SPAWN_INTERVAL_START_MS, C.SPAWN_INTERVAL_MIN_MS, t)
  const travelMs = lerp(C.CUSTOMER_TRAVEL_MS_START, C.CUSTOMER_TRAVEL_MS_MIN, t)

  // Spawning
  sim.nextSpawnInMs -= dt * 1000
  if (sim.nextSpawnInMs <= 0) {
    trySpawnCustomer(sim, travelMs)
    sim.nextSpawnInMs = spawnInterval
  }

  // Running left/right along the counter, while a run button is held.
  if (sim.moveDir !== 0) {
    sim.playerX += sim.moveDir * C.PLAYER_RUN_SPEED_X * dt
    if (sim.playerX < C.PLAYER_X) sim.playerX = C.PLAYER_X
    if (sim.playerX > C.PLAYER_MAX_X) sim.playerX = C.PLAYER_MAX_X
  }

  // A hot dog drops on the counter now and then, within run range — grab
  // it before it goes cold and disappears, or don't; no penalty either way.
  sim.nextBonusInMs -= dt * 1000
  if (!sim.bonus && sim.nextBonusInMs <= 0) {
    sim.bonus = {
      id: sim.nextId++,
      lane: Math.floor(Math.random() * C.LANE_COUNT),
      x: randomBetween(C.PLAYER_X, C.PLAYER_MAX_X),
      remainingMs: C.BONUS_LIFETIME_MS,
    }
    sim.nextBonusInMs = randomBetween(C.BONUS_SPAWN_INTERVAL_MIN_MS, C.BONUS_SPAWN_INTERVAL_MAX_MS)
  }
  if (sim.bonus) {
    sim.bonus.remainingMs -= dt * 1000
    if (sim.bonus.remainingMs <= 0) sim.bonus = null
  }

  // Customers move first. Removal is decided afterward (below), once mugs
  // have had a chance to resolve against these fresh positions — otherwise
  // a customer served on the same frame they cross the end of the bar could
  // still get counted as unserved (mug resolution would be checking last
  // frame's stale position, one step behind).
  for (const c of sim.customers) {
    if (c.status === 'walking') {
      c.x -= c.speed * dt
    } else if (c.status === 'leaving-happy') {
      c.x += c.speed * dt
    }
  }

  // Mugs in flight — thrown toward whichever customer is still walking in
  // that lane. Resolves the instant it reaches them; if it sails all the
  // way past the far edge without hitting anyone, it breaks and costs a
  // life — including a mug that doesn't match what the customer ordered:
  // it just sails through them uncaught, same as if no one were there.
  for (const m of sim.mugs) {
    m.x += m.speed * dt
  }
  for (const m of sim.mugs) {
    const target = sim.customers.find(
      (c) => c.lane === m.lane && c.status === 'walking' && c.drinkType === m.drinkType
    )
    if (target && m.x >= target.x) {
      sim.score += C.POINTS_PER_SERVE
      target.status = 'leaving-happy'
      target.speed = (C.OFFSCREEN_X - target.x) / (C.CUSTOMER_WALK_OUT_MS / 1000)

      if (Math.random() < C.GLASS_RETURN_CHANCE) {
        sim.glasses.push({
          id: sim.nextId++,
          lane: m.lane,
          x: target.x,
          speed: (C.OFFSCREEN_X - C.PLAYER_X) / (C.GLASS_RETURN_TRAVEL_MS / 1000),
        })
      }
      m._arrived = true
    } else if (m.x >= C.OFFSCREEN_X) {
      m._missed = true
    }
  }
  const missedMugCount = sim.mugs.filter((m) => m._missed).length
  if (missedMugCount > 0) loseLife(sim, missedMugCount)
  sim.mugs = sim.mugs.filter((m) => !m._arrived && !m._missed)

  // Now decide removals. An unserved (still 'walking') customer who reached
  // the end of the bar costs a life; a served one who made it back offscreen
  // just leaves.
  for (const c of sim.customers) {
    if (c.status === 'walking' && c.x <= C.END_OF_BAR_X) {
      c.x = C.END_OF_BAR_X
      c._remove = true
      loseLife(sim)
      // Only the bartender's own lane gets the seltzer in the face — the
      // player isn't even standing in the others.
      if (c.lane === sim.playerLane) sim.spillCount++
    } else if (c.status === 'leaving-happy' && c.x >= C.OFFSCREEN_X) {
      c._remove = true
    }
  }
  sim.customers = sim.customers.filter((c) => !c._remove)

  // Returning glasses
  for (const g of sim.glasses) {
    g.x -= g.speed * dt
    if (g.x <= C.PLAYER_X) g._missed = true
  }
  const missedCount = sim.glasses.filter((g) => g._missed).length
  if (missedCount > 0) loseLife(sim, missedCount)
  sim.glasses = sim.glasses.filter((g) => !g._missed)
}

export function useGameEngine() {
  const simRef = useRef(createInitialSim())
  const lastTsRef = useRef(null)
  const rafRef = useRef(null)
  const [, setTick] = useState(0)

  useEffect(() => {
    const loop = (ts) => {
      if (lastTsRef.current == null) lastTsRef.current = ts
      const dt = Math.min((ts - lastTsRef.current) / 1000, 0.05)
      lastTsRef.current = ts
      if (!simRef.current.gameOver) step(simRef.current, dt)
      setTick((n) => n + 1)
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  const changeLane = useCallback((direction) => {
    const sim = simRef.current
    if (sim.gameOver) return
    let newLane = sim.playerLane + direction
    if (newLane < 0) newLane = C.LANE_COUNT - 1
    if (newLane >= C.LANE_COUNT) newLane = 0
    sim.playerLane = newLane
  }, [])

  const serveOrCatch = useCallback(() => {
    const sim = simRef.current
    if (sim.gameOver) return
    const lane = sim.playerLane

    // Catch a returning glass if there is one, but don't let that stop the
    // same press from also serving a customer — otherwise a lingering
    // glass silently eats a press meant for someone waiting.
    const glassIdx = sim.glasses.findIndex((g) => g.lane === lane)
    if (glassIdx !== -1) {
      sim.glasses.splice(glassIdx, 1)
      sim.score += C.POINTS_PER_CAUGHT_GLASS
    }

    // Grab the hot dog too, if it's here and within reach — same press,
    // doesn't block serving.
    if (sim.bonus && sim.bonus.lane === lane && Math.abs(sim.bonus.x - sim.playerX) <= C.BONUS_REACH_X) {
      sim.score += C.POINTS_PER_BONUS
      sim.bonus = null
    }

    // One mug in flight per lane at a time, to keep the prototype simple.
    if (sim.mugs.some((m) => m.lane === lane)) return

    const hasTarget = sim.customers.some((c) => c.lane === lane && c.status === 'walking')
    if (!hasTarget) return

    sim.mugs.push({
      id: sim.nextId++,
      lane,
      x: sim.playerX,
      speed: (C.OFFSCREEN_X - C.PLAYER_X) / (C.MUG_TRAVEL_MS / 1000),
      drinkType: sim.selectedDrink,
      color: C.DRINK_TYPES[sim.selectedDrink].color,
    })
  }, [])

  const selectDrink = useCallback((index) => {
    simRef.current.selectedDrink = index
  }, [])

  const startRun = useCallback((direction) => {
    const sim = simRef.current
    if (sim.gameOver) return
    sim.moveDir = direction
  }, [])

  const stopRun = useCallback(() => {
    simRef.current.moveDir = 0
  }, [])

  const startGame = useCallback(() => {
    simRef.current.started = true
    setTick((n) => n + 1)
  }, [])

  const restart = useCallback(() => {
    simRef.current = createInitialSim()
    simRef.current.started = true // reopening after game-over skips the splash
    lastTsRef.current = null
    setTick((n) => n + 1)
  }, [])

  return { state: simRef.current, changeLane, serveOrCatch, startRun, stopRun, selectDrink, startGame, restart }
}
