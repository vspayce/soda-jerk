import { useRef, useState, useCallback, useEffect } from 'react'
import * as C from './constants'
import { LEVELS, getLevelForScore } from './levels.js'

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min)
}

// Fresh state for a bonus-round attempt — the scoop starts at rest on
// the launch anchor, ready to be pulled back, tinted a random flavor
// that has to land in the matching cup to score.
function createBonusLevelState() {
  return {
    wheelAngle: 0,
    throwsLeft: C.BONUS_LEVEL_THROWS,
    scoopState: 'ready', // 'ready' | 'aiming' | 'flying' | 'result'
    scoopX: C.BONUS_LAUNCH_ANCHOR.x,
    scoopY: C.BONUS_LAUNCH_ANCHOR.y,
    vx: 0,
    vy: 0,
    aimDX: 0, // how far the scoop's currently pulled back from the
    aimDY: 0, // anchor, while aiming — the drag vector itself
    iceCreamColor: Math.floor(Math.random() * C.BONUS_CUP_COUNT), // index
    // into BONUS_CUP_COLORS — which cup this throw's scoop needs to land in
    resultText: null, // 'HIT! +500' | 'MISS' while scoopState is 'result'
    resultHoldMs: 0,
  }
}

// Fresh state for a plate-wash bonus-round attempt.
function createPlatesLevelState() {
  return {
    remainingMs: C.PLATES_ROUND_MS,
    // One independent spawn timer per lane/conveyor belt — see stepPlates —
    // so all three run concurrently instead of one shared timer picking a
    // single random lane each time.
    nextSpawnInMs: Object.fromEntries(
      C.PLATES_LANES.map((lane) => [lane, randomBetween(C.PLATES_SPAWN_INTERVAL_MIN_MS, C.PLATES_SPAWN_INTERVAL_MAX_MS)])
    ),
    plates: [], // { id, lane, progress (0-1), kind: 'dirty'|'clean'|'dollar' }
    popCount: 0, // bumped whenever a dirty/dollar plate is sprayed — App.jsx
    // watches this for a little sfx, same pattern as celebrateCount etc.
    lastPopKind: null,
    resultText: null, // set once the round is ending — "TIME'S UP!" or the
    // clean-plate scold — shown for resultHoldMs before returning to the bar
    resultHoldMs: 0,
    ended: false,
    nextId: 1,
  }
}

// Bounds of the belt each row's cups travel along — padded off both edges
// of the screen so cups scroll on/off seamlessly instead of popping.
const SHAKER_TRACK_MIN_X = -C.SHAKER_TRACK_PAD_PCT
const SHAKER_TRACK_MAX_X = 100 + C.SHAKER_TRACK_PAD_PCT
const SHAKER_TRACK_LENGTH = SHAKER_TRACK_MAX_X - SHAKER_TRACK_MIN_X

// Fresh state for a shaker-cup bonus-round attempt — each row is a train
// of cups packed snugly together spanning the whole belt, all cups within
// a row moving at one shared speed so the spacing (and the sushi-conveyor
// look) holds steady as they scroll past.
function createShakerLevelState() {
  const cups = []
  for (const row of C.SHAKER_ROWS) {
    // Round to the nearest cup count that tiles the belt with NO seam —
    // using the raw target spacing directly left a leftover fractional gap
    // that wrapped around into a near-duplicate cup sitting right on top of
    // another. Deriving the actual spacing from the count instead makes
    // count * spacing land on SHAKER_TRACK_LENGTH exactly. Done per row
    // since each row's cup size (and so its spacing) scales differently
    // for the perspective effect — see SHAKER_ROWS' `scale`.
    const spacingTarget = C.SHAKER_CUP_SPACING_PCT * row.scale
    const count = Math.max(1, Math.round(SHAKER_TRACK_LENGTH / spacingTarget))
    const spacing = SHAKER_TRACK_LENGTH / count
    // Smaller (more distant-looking) cups drift slower, same depth cue as
    // their smaller size — real motion, not just a smaller sprite.
    const speed = randomBetween(C.SHAKER_CUP_SPEED_MIN_X, C.SHAKER_CUP_SPEED_MAX_X) * row.scale
    const phase = Math.random() * spacing
    for (let i = 0; i < count; i++) {
      const raw = SHAKER_TRACK_MIN_X + phase + i * spacing
      const x = (((raw - SHAKER_TRACK_MIN_X) % SHAKER_TRACK_LENGTH) + SHAKER_TRACK_LENGTH) % SHAKER_TRACK_LENGTH + SHAKER_TRACK_MIN_X
      cups.push({
        id: `${row.lane}-${i}`,
        lane: row.lane,
        y: row.y,
        x,
        dir: row.dir,
        speed,
        size: C.SHAKER_CUP_SIZE_PCT * row.scale,
        color: Math.floor(Math.random() * C.BONUS_CUP_COUNT), // purely cosmetic variety
      })
    }
  }
  return {
    throwsLeft: C.SHAKER_ROUND_THROWS,
    cups,
    scoopState: 'ready', // 'ready' | 'aiming' | 'flying' | 'result' — same
    // shape as the wheel round's bonusLevel.scoopState
    scoopX: C.SHAKER_LAUNCH_ANCHOR.x,
    scoopY: C.SHAKER_LAUNCH_ANCHOR.y,
    aimDX: 0,
    aimDY: 0,
    vx: 0,
    vy: 0,
    resultText: null, // 'HIT!' | 'MISS' — brief flash after each throw resolves
    resultHoldMs: 0,
    resolvedCount: 0, // bumped every time a throw resolves — App.jsx watches
    // this (alongside resultText) to fire the matching hit/miss sfx
    ended: false,
  }
}

function pickPlateKind() {
  const r = Math.random()
  if (r < C.PLATES_KIND_WEIGHTS.dirty) return 'dirty'
  if (r < C.PLATES_KIND_WEIGHTS.dirty + C.PLATES_KIND_WEIGHTS.clean) return 'clean'
  return 'dollar'
}

function createInitialSim() {
  return {
    started: false,
    mode: 'bar', // 'bar' | 'bonusWheel' | 'bonusPlates' | 'bonusShaker' — swaps
    // the whole gameplay loop over to one of the three bonus mini-games; see
    // stepBonus()/BonusLevel.jsx, stepPlates()/PlatesLevel.jsx, and
    // stepShaker()/ShakerLevel.jsx
    bonusLevel: null, // set to createBonusLevelState() while mode is 'bonusWheel'
    platesLevel: null, // set to createPlatesLevelState() while mode is 'bonusPlates'
    shakerLevel: null, // set to createShakerLevelState() while mode is 'bonusShaker'
    playerLane: 0,
    playerX: C.PLAYER_X,
    moveDir: 0, // -1 left, 0 still, 1 right — set by holding a run button
    runTargetX: null, // set when the bartender is auto-running to a tapped
    // hot dog; overridden the instant manual dragging starts
    selectedDrink: 0, // index into C.DRINK_TYPES — what the next mug pours
    lives: C.STARTING_LIVES,
    score: 0,
    survivalMs: 0,
    level: 1, // current difficulty level — see levels.js
    stage: 1, // current lane-capacity stage — see STAGE_LANE_CAPACITY in
    // constants.js. Unrelated to `level` above: this only changes how many
    // customers can queue in one lane, advanced by clearing the bar, not by
    // score.
    stageAttemptActive: false, // true from the moment every lane fills
    // until that exact batch is fully resolved (served-all, or a life
    // lost) — spawning is frozen the whole time (see the spawn block in
    // step()), so the board can only shrink by serving/missing that
    // batch, never get topped back up by fresh arrivals mid-attempt
    stageAttemptClean: false, // true only if no life has been lost since
    // stageAttemptActive was last set — passing the stage requires every
    // patron on the bar to actually be served, not just gone from a miss
    awaitingStageAdvance: false, // true once the bar's been fully cleared
    // (served, not missed) after an armed, clean attempt — freezes the
    // sim (like awaitingContinue) until the "LEVEL PASSED" screen is
    // dismissed via advanceStage()
    gameOver: false,
    awaitingContinue: false, // true right after a life is lost (but the
    // game isn't over) — freezes the sim until continueAfterDeath() is
    // called, when the "YOU MISSED" button is tapped
    missReason: null, // 'spray' | 'glass' | 'mug' | 'no-patron' | 'other' — which
    // kind of miss most recently triggered awaitingContinue, so the UI can
    // show the matching sprite
    customers: [],
    mugs: [],
    glasses: [],
    bonus: null,
    celebrateCount: 0, // bumped whenever a hot dog is grabbed — App.jsx
    // watches this to fire a little confetti-and-points celebration.
    lastCelebrate: null, // { lane, x } of the most recent hot dog grab
    spillCount: 0, // bumped whenever an unserved customer reaches the end
    // of the bar in the player's own lane — App.jsx watches this to fire
    // the seltzer-in-the-face reaction.
    throwingMs: 0, // counts down after pourDrink() — Player.jsx plays the
    // throw-motion sprite while this is > 0, then falls back to stand/run
    lastSpillDrinkType: 0, // whose drink they wanted — picks which patron sprays
    lastSpillPatronType: 0, // and which illustration — picks which patron sprays
    missedGlassCount: 0, // bumped whenever a returning glass slides off
    // the counter uncaught — App.jsx watches this to play the shatter sfx
    mugCrashCount: 0, // bumped whenever a thrown mug sails past with no
    // one to catch it — App.jsx watches this to play the crash sfx
    pendingSprayDrinkType: null, // set while the bartender is being
    // recalled to the counter after a spill, until he's actually back
    pendingSprayPatronType: 0,
    continuePauseInMs: null, // counts down while he's held at the counter
    // getting sprayed, before awaitingContinue kicks in
    nextSpawnInMs: LEVELS[0].spawnIntervalMs,
    nextBonusInMs: randomBetween(C.BONUS_SPAWN_INTERVAL_MIN_MS, C.BONUS_SPAWN_INTERVAL_MAX_MS),
    nextId: 1,
  }
}

function loseLife(sim, n = 1) {
  sim.lives -= n
  if (sim.lives <= 0) {
    sim.lives = 0
    sim.gameOver = true
  }
}

function trySpawnCustomer(sim, travelMs) {
  // Cap how many active (still walking) customers can queue in the same
  // lane at once — one at stage 1, two at stage 2 (see STAGE_LANE_CAPACITY)
  // — so arrivals stay readable. A lane with a mug still in flight is
  // always off-limits regardless of stage — otherwise a mug thrown down an
  // empty lane can catch a customer the instant they spawn, off-screen past
  // the visible edge, before the player has ever seen them walk in.
  const capacity = C.STAGE_LANE_CAPACITY[sim.stage - 1] ?? 1
  const walkingCountByLane = new Map()
  for (const c of sim.customers) {
    if (c.status === 'walking') walkingCountByLane.set(c.lane, (walkingCountByLane.get(c.lane) || 0) + 1)
  }
  const mugLanes = new Set(sim.mugs.map((m) => m.lane))
  const openLanes = []
  for (let i = 0; i < C.LANE_COUNT; i++) {
    if ((walkingCountByLane.get(i) || 0) < capacity && !mugLanes.has(i)) openLanes.push(i)
  }
  if (openLanes.length === 0) return

  const lane = pick(openLanes)
  const speed = (C.OFFSCREEN_X - C.END_OF_BAR_X) / (travelMs / 1000)
  const drinkType = Math.floor(Math.random() * C.DRINK_TYPES.length)
  const patronTypeCount = sim.stage >= 2 ? C.PATRON_TYPE_COUNT_FOUNTAIN : C.PATRON_TYPE_COUNT
  const patronType = Math.floor(Math.random() * patronTypeCount)

  sim.customers.push({
    id: sim.nextId++,
    lane,
    x: C.OFFSCREEN_X,
    status: 'walking', // walking -> leaving-happy (served) | removed (reached end of bar)
    speed,
    drinkType,
    patronType, // which illustration to use
    // The mom-and-son pair (patronType 1) is two people — testing what it
    // feels like to need a drink for each of them before they'll leave,
    // same drink type both times. They keep walking (and can still reach
    // the end and cost a life) until this hits 0.
    drinksNeeded: patronType === 1 ? 2 : 1,
    pauseMs: 0, // counts down while paused mid-walk — see below, keeps
    // them from marching in a dead straight line the whole way
    drinkName: C.DRINK_TYPES[drinkType].name,
    color: C.DRINK_TYPES[drinkType].color,
  })
}

// The wheel-throw bonus round — an entirely different mini-game from the
// bar, so it gets its own physics tick instead of threading through the
// lane logic above. Coordinates are all percentages of the bonus arena's
// own square play field (see BONUS_* in constants.js and BonusLevel.jsx).
function stepBonus(sim, dt) {
  const b = sim.bonusLevel
  if (!b) return

  // The wheel spins continuously while a throw is live — that's the
  // actual challenge, timing it against the spin — but holds still once
  // one lands, so a scoop that made it into a cup stays visibly sitting
  // there (rather than the wheel spinning on and leaving it behind) for
  // the "HIT!"/"MISS" beat.
  if (b.scoopState !== 'result') {
    b.wheelAngle = (b.wheelAngle + C.BONUS_WHEEL_SPIN_DEG_PER_S * dt) % 360
  }

  if (b.scoopState === 'flying') {
    b.scoopX += b.vx * dt
    b.scoopY += b.vy * dt
    b.vy += C.BONUS_GRAVITY * dt

    let landedCupIndex = null
    let landedCupX = null
    let landedCupY = null
    for (let i = 0; i < C.BONUS_CUP_COUNT; i++) {
      const angleRad = ((b.wheelAngle + i * 90) * Math.PI) / 180
      // The 4 slots aren't a perfect circle in the source art, hence the
      // separate x/y radius — see BONUS_WHEEL_HOLE_FRACTION_* above.
      const cupX = C.BONUS_WHEEL_CENTER.x + C.BONUS_WHEEL_RADIUS_X * Math.cos(angleRad)
      const cupCenterY = C.BONUS_WHEEL_CENTER.y + C.BONUS_WHEEL_RADIUS_Y * Math.sin(angleRad)
      // The cup image renders centered on that hole position, but the
      // opening is up near its top edge — the cups always stay upright
      // (counter-rotated against the wheel's spin, see BonusLevel.jsx),
      // so that opening is always straight up from the center by a fixed
      // amount, regardless of wheelAngle.
      const cupY = cupCenterY - C.BONUS_CUP_RIM_OFFSET_Y
      const dist = Math.hypot(b.scoopX - cupX, b.scoopY - cupY)
      if (dist <= C.BONUS_HIT_RADIUS) {
        landedCupIndex = i
        landedCupX = cupX
        landedCupY = cupY
        break
      }
    }

    const offArena = b.scoopX < -15 || b.scoopX > 115 || b.scoopY > 115 || b.scoopY < -25
    if (landedCupIndex !== null) {
      // Snap to the cup's exact center so it visually sits in the cup
      // rather than wherever it happened to cross the hit radius — a
      // metal cup stops the scoop either way, whether or not the color
      // matches.
      b.scoopX = landedCupX
      b.scoopY = landedCupY
      b.vx = 0
      b.vy = 0
      if (landedCupIndex === b.iceCreamColor) {
        sim.score += C.BONUS_LEVEL_POINTS
        b.resultText = `HIT! +${C.BONUS_LEVEL_POINTS}`
      } else {
        b.resultText = 'WRONG CUP'
      }
      b.scoopState = 'result'
      b.resultHoldMs = C.BONUS_RESULT_HOLD_MS
    } else if (offArena) {
      b.resultText = 'MISS'
      b.scoopState = 'result'
      b.resultHoldMs = C.BONUS_RESULT_HOLD_MS
    }
  } else if (b.scoopState === 'result') {
    b.resultHoldMs -= dt * 1000
    if (b.resultHoldMs <= 0) {
      b.throwsLeft -= 1
      if (b.throwsLeft > 0) {
        b.scoopState = 'ready'
        b.scoopX = C.BONUS_LAUNCH_ANCHOR.x
        b.scoopY = C.BONUS_LAUNCH_ANCHOR.y
        b.vx = 0
        b.vy = 0
        b.aimDX = 0
        b.aimDY = 0
        b.resultText = null
        b.iceCreamColor = Math.floor(Math.random() * C.BONUS_CUP_COUNT)
      } else {
        // Wheel round's over — a clean full clear sends the player to
        // exactly one of the three bonus rounds (see the trigger in
        // step()), so this one's done on its own, straight back to the bar.
        // Reset the stage-clear attempt so a future clean full-clear can
        // send the player to a bonus round again.
        sim.mode = 'bar'
        sim.bonusLevel = null
        sim.stageAttemptActive = false
        sim.stageAttemptClean = false
      }
    }
  }
}

// The plate-wash bonus round — a first-person shooting gallery. Plates
// approach in 3 lanes; a click removes whichever one it lands on
// (checked by simple screen-space distance to the plate's current
// interpolated position, same spirit as the wheel round's cup check).
function stepPlates(sim, dt) {
  const p = sim.platesLevel
  if (!p) return

  if (p.ended) {
    p.resultHoldMs -= dt * 1000
    if (p.resultHoldMs <= 0) {
      // Round's over — back to the bar. Reset the stage-clear attempt so
      // a future clean full-clear can send the player back through both
      // bonus rounds again.
      sim.mode = 'bar'
      sim.platesLevel = null
      sim.stageAttemptActive = false
      sim.stageAttemptClean = false
    }
    return
  }

  p.remainingMs -= dt * 1000
  if (p.remainingMs <= 0) {
    p.ended = true
    p.resultText = "TIME'S UP!"
    p.resultHoldMs = C.PLATES_RESULT_HOLD_MS
    return
  }

  for (const lane of C.PLATES_LANES) {
    p.nextSpawnInMs[lane] -= dt * 1000
    if (p.nextSpawnInMs[lane] <= 0) {
      p.plates.push({ id: p.nextId++, lane, progress: 0, kind: pickPlateKind() })
      p.nextSpawnInMs[lane] = randomBetween(C.PLATES_SPAWN_INTERVAL_MIN_MS, C.PLATES_SPAWN_INTERVAL_MAX_MS)
    }
  }

  for (const plate of p.plates) {
    plate.progress += (dt * 1000) / C.PLATES_TRAVEL_MS
    // Reached the player without being clicked — no penalty either way,
    // dirty/dollar or clean, it just goes by. Missing a dollar plate only
    // costs the points you could've had, same as ignoring the hot dog.
    if (plate.progress >= 1) plate._remove = true
  }
  p.plates = p.plates.filter((pl) => !pl._remove)
}

// The shaker-cup bonus round — three rows, each a belt of cups packed
// right next to each other and scrolling past like a sushi conveyor. The
// throw itself is the same Angry-Birds pull-back-and-release physics as
// the wheel round (see stepBonus above): pull harder to arc higher and
// reach an upper row, then land wherever that arc actually carries the
// scoop — see shakerAimStart/Move/End for where a throw actually fires.
function stepShaker(sim, dt) {
  const s = sim.shakerLevel
  if (!s) return

  if (s.ended) {
    s.resultHoldMs -= dt * 1000
    if (s.resultHoldMs <= 0) {
      sim.mode = 'bar'
      sim.shakerLevel = null
      sim.stageAttemptActive = false
      sim.stageAttemptClean = false
    }
    return
  }

  // The belts keep scrolling no matter what the scoop's doing — a cup
  // train that paused mid-aim would give the game away.
  for (const cup of s.cups) {
    cup.x += cup.dir * cup.speed * dt
    if (cup.x > SHAKER_TRACK_MAX_X) cup.x -= SHAKER_TRACK_LENGTH
    else if (cup.x < SHAKER_TRACK_MIN_X) cup.x += SHAKER_TRACK_LENGTH
  }

  if (s.scoopState === 'flying') {
    s.scoopX += s.vx * dt
    s.scoopY += s.vy * dt
    s.vy += C.SHAKER_GRAVITY * dt

    // Same shape as the wheel round's per-cup distance check, just with
    // separate x/y radii since these cups sit in flat horizontal rows
    // instead of around a circle. Scaled per cup by its own size so the
    // smaller "distant" cups aren't secretly as easy to hit as the big
    // "near" ones — the hitbox should match what's actually on screen.
    const landedCup = s.cups.find((c) => {
      const cupScale = c.size / C.SHAKER_CUP_SIZE_PCT
      return (
        Math.abs(s.scoopY - c.y) <= C.SHAKER_CUP_HIT_RADIUS_Y * cupScale &&
        Math.abs(s.scoopX - c.x) <= C.SHAKER_CUP_HIT_RADIUS_X * cupScale
      )
    })
    const offArena = s.scoopX < -15 || s.scoopX > 115 || s.scoopY > 115 || s.scoopY < -25

    if (landedCup) {
      s.scoopX = landedCup.x
      s.scoopY = landedCup.y
      s.vx = 0
      s.vy = 0
      sim.score += C.SHAKER_HIT_POINTS
      s.resultText = 'HIT!'
      s.resultHoldMs = C.SHAKER_RESULT_HOLD_MS
      s.resolvedCount++
      s.scoopState = 'result'
    } else if (offArena) {
      s.resultText = 'MISS'
      s.resultHoldMs = C.SHAKER_RESULT_HOLD_MS
      s.resolvedCount++
      s.scoopState = 'result'
    }
  } else if (s.scoopState === 'result') {
    s.resultHoldMs -= dt * 1000
    if (s.resultHoldMs <= 0) {
      s.throwsLeft -= 1
      if (s.throwsLeft > 0) {
        s.scoopState = 'ready'
        s.scoopX = C.SHAKER_LAUNCH_ANCHOR.x
        s.scoopY = C.SHAKER_LAUNCH_ANCHOR.y
        s.vx = 0
        s.vy = 0
        s.aimDX = 0
        s.aimDY = 0
        s.resultText = null
      } else {
        s.ended = true
        s.resultHoldMs = C.SHAKER_ROUND_END_HOLD_MS
      }
    }
  }
}

function step(sim, dt) {
  if (!sim.started) return
  if (sim.mode === 'bonusWheel') {
    stepBonus(sim, dt)
    return
  }
  if (sim.mode === 'bonusPlates') {
    stepPlates(sim, dt)
    return
  }
  if (sim.mode === 'bonusShaker') {
    stepShaker(sim, dt)
    return
  }
  if (sim.awaitingContinue) return
  if (sim.awaitingStageAdvance) return

  sim.survivalMs += dt * 1000
  if (sim.throwingMs > 0) {
    sim.throwingMs = Math.max(0, sim.throwingMs - dt * 1000)
  }
  const levelInfo = getLevelForScore(sim.score)
  sim.level = levelInfo.level
  const spawnInterval = levelInfo.spawnIntervalMs
  const travelMs = levelInfo.customerTravelMs * (C.STAGE_TRAVEL_MULTIPLIER[sim.stage - 1] ?? 1)

  // Spawning — frozen entirely during an active stage-clear attempt
  // (every lane filled, waiting to see if that exact batch clears
  // cleanly), so the board can only shrink from here, never get topped
  // back up by a fresh arrival mid-attempt.
  if (!sim.stageAttemptActive) {
    sim.nextSpawnInMs -= dt * 1000
    if (sim.nextSpawnInMs <= 0) {
      trySpawnCustomer(sim, travelMs)
      sim.nextSpawnInMs = spawnInterval
    }
  }

  // Running left/right along the counter — either manually, while a drag
  // is held, or automatically toward a tapped hot dog until he arrives.
  if (sim.runTargetX !== null) {
    const dir = sim.runTargetX > sim.playerX ? 1 : -1
    sim.moveDir = dir
    sim.playerX += dir * C.PLAYER_RUN_SPEED_X * dt
    if ((dir === 1 && sim.playerX >= sim.runTargetX) || (dir === -1 && sim.playerX <= sim.runTargetX)) {
      sim.playerX = sim.runTargetX
      sim.runTargetX = null
      sim.moveDir = 0
    }
  } else if (sim.moveDir !== 0) {
    sim.playerX += sim.moveDir * C.PLAYER_RUN_SPEED_X * dt
  }
  if (sim.playerX < C.PLAYER_X) sim.playerX = C.PLAYER_X
  if (sim.playerX > C.PLAYER_MAX_X) sim.playerX = C.PLAYER_MAX_X

  // A spill from last frame recalls the bartender to the counter (see
  // below) — the spray itself only fires once he's actually back, so
  // it's never shown happening off in the middle of the bar somewhere.
  if (sim.pendingSprayDrinkType !== null && sim.playerX <= C.PLAYER_X) {
    sim.spillCount++
    sim.lastSpillDrinkType = sim.pendingSprayDrinkType
    sim.lastSpillPatronType = sim.pendingSprayPatronType
    sim.pendingSprayDrinkType = null
    sim.moveDir = 0
    // Hold him there getting sprayed for a couple seconds before pausing
    // for the "YOU MISSED" screen — the life was already lost the
    // instant he reached the end of the bar, this is just letting it
    // play out.
    sim.continuePauseInMs = C.SPRAY_HOLD_MS
  }
  if (sim.continuePauseInMs !== null) {
    sim.continuePauseInMs -= dt * 1000
    if (sim.continuePauseInMs <= 0) {
      sim.continuePauseInMs = null
      if (!sim.gameOver) {
        sim.missReason = 'spray'
        sim.awaitingContinue = true
      }
    }
  }

  // A hot dog drops on the counter now and then, within run range — grab
  // it before it goes cold and disappears, or don't; no penalty either way.
  sim.nextBonusInMs -= dt * 1000
  if (!sim.bonus && sim.nextBonusInMs <= 0) {
    sim.bonus = {
      id: sim.nextId++,
      lane: Math.floor(Math.random() * C.LANE_COUNT),
      x: randomBetween(C.BONUS_MIN_X, C.PLAYER_MAX_X),
      remainingMs: C.BONUS_LIFETIME_MS,
    }
    sim.nextBonusInMs = randomBetween(C.BONUS_SPAWN_INTERVAL_MIN_MS, C.BONUS_SPAWN_INTERVAL_MAX_MS)
  }
  if (sim.bonus) {
    sim.bonus.remainingMs -= dt * 1000
    if (sim.bonus.remainingMs <= 0) {
      sim.bonus = null
      sim.runTargetX = null
    }
  }

  // Running right up to the hot dog auto-grabs it too — no need to stop
  // and press anything, same as tapping it directly. This is also how a
  // tap on the hot dog itself resolves, once the auto-run above gets him
  // there (see grabBonus) — it vanishes instantly and he jumps straight
  // back to the counter, same as picking a drink.
  if (sim.bonus && sim.bonus.lane === sim.playerLane && Math.abs(sim.bonus.x - sim.playerX) <= C.BONUS_REACH_X) {
    sim.score += C.POINTS_PER_BONUS
    sim.lastCelebrate = { lane: sim.bonus.lane, x: sim.bonus.x }
    sim.celebrateCount++
    sim.bonus = null
    sim.playerX = C.PLAYER_X
    sim.runTargetX = null
    sim.moveDir = 0
  }

  // Customers move first. Removal is decided afterward (below), once mugs
  // have had a chance to resolve against these fresh positions — otherwise
  // a customer served on the same frame they cross the end of the bar could
  // still get counted as unserved (mug resolution would be checking last
  // frame's stale position, one step behind).
  for (const c of sim.customers) {
    if (c.status === 'walking') {
      if (c.pauseMs > 0) {
        c.pauseMs -= dt * 1000
      } else {
        c.x -= c.speed * dt
        // Every so often, stop for a beat instead of marching in dead
        // a straight line the whole way — just a brief hitch, not a
        // real stall.
        if (Math.random() < C.WALK_PAUSE_CHANCE_PER_FRAME) {
          c.pauseMs = randomBetween(C.WALK_PAUSE_MIN_MS, C.WALK_PAUSE_MAX_MS)
        }
      }
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
      target.drinksNeeded -= 1
      if (target.drinksNeeded <= 0) {
        target.status = 'leaving-happy'
        target.speed = (C.OFFSCREEN_X - target.x) / (C.CUSTOMER_WALK_OUT_MS / 1000)
      }

      // One returning glass per lane at a time — otherwise catching the
      // only one you can see still leaves a second one uncaught to be
      // missed later, costing a life despite having "gotten the glass".
      const laneHasGlass = sim.glasses.some((g) => g.lane === m.lane)
      if (!laneHasGlass && Math.random() < C.GLASS_RETURN_CHANCE) {
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
      // Distinguishes a drink thrown at the wrong-colored customer (still
      // someone there to miss) from one thrown down a lane with no one
      // walking in it at all — the UI shows a different message/art for each.
      m._hadPatron = sim.customers.some((c) => c.lane === m.lane && c.status === 'walking')
    }
  }
  const missedMugCount = sim.mugs.filter((m) => m._missed).length
  if (missedMugCount > 0) {
    sim.mugCrashCount++
    loseLife(sim, missedMugCount)
    if (sim.stageAttemptActive) {
      sim.stageAttemptClean = false
      sim.stageAttemptActive = false
    }
    if (!sim.gameOver) {
      sim.missReason = sim.mugs.some((m) => m._missed && !m._hadPatron) ? 'no-patron' : 'mug'
      sim.awaitingContinue = true
    }
  }
  sim.mugs = sim.mugs.filter((m) => !m._arrived && !m._missed)

  // Now decide removals. An unserved (still 'walking') customer who reached
  // the end of the bar costs a life; a served one who made it back offscreen
  // just leaves.
  for (const c of sim.customers) {
    if (c.status === 'walking' && c.x <= C.END_OF_BAR_X) {
      c.x = C.END_OF_BAR_X
      c._remove = true
      loseLife(sim)
      if (sim.stageAttemptActive) {
        sim.stageAttemptClean = false
        sim.stageAttemptActive = false
      }
      // Only the bartender's own lane gets the in-game seltzer-in-the-face
      // recall animation — the player isn't even standing in the others,
      // so there's nothing to visibly run back for. Either way it's a
      // spray as far as the "YOU GOT SPRAYED!" pause screen is concerned,
      // and either way the spray sound plays and there's a beat before
      // that screen shows up — in his own lane that beat is the recall
      // actually playing out (see the pending-spray check above), but
      // elsewhere it's just a short pause since there's no animation to
      // wait for.
      if (c.lane === sim.playerLane) {
        sim.pendingSprayDrinkType = c.drinkType
        sim.pendingSprayPatronType = c.patronType
        sim.moveDir = -1
      } else if (!sim.gameOver) {
        sim.spillCount++
        sim.lastSpillDrinkType = c.drinkType
        sim.lastSpillPatronType = c.patronType
        sim.continuePauseInMs = C.SPRAY_OTHER_LANE_HOLD_MS
      }
    } else if (c.status === 'leaving-happy' && c.x >= C.OFFSCREEN_X) {
      c._remove = true
    }
  }
  sim.customers = sim.customers.filter((c) => !c._remove)

  // Returning glasses — missed if one slides all the way back to the
  // counter's edge uncaught, but running over one anywhere along the way
  // auto-grabs it, same as tapping it directly.
  for (const g of sim.glasses) {
    g.x -= g.speed * dt
    if (g.lane === sim.playerLane && Math.abs(g.x - sim.playerX) <= C.GLASS_REACH_X) {
      g._caught = true
    } else if (g.x <= C.PLAYER_X) {
      g._missed = true
    }
  }
  const missedCount = sim.glasses.filter((g) => g._missed).length
  if (missedCount > 0) {
    sim.missedGlassCount++
    loseLife(sim, missedCount)
    if (sim.stageAttemptActive) {
      sim.stageAttemptClean = false
      sim.stageAttemptActive = false
    }
    if (!sim.gameOver) {
      sim.missReason = 'glass'
      sim.awaitingContinue = true
    }
  }
  const autoCaughtCount = sim.glasses.filter((g) => g._caught).length
  if (autoCaughtCount > 0) sim.score += autoCaughtCount * C.POINTS_PER_CAUGHT_GLASS
  sim.glasses = sim.glasses.filter((g) => !g._missed && !g._caught)

  // Stage advance: the moment every lane fills up at once arms a fresh
  // attempt and freezes spawning (see the spawn block above) — that
  // exact batch has to reach zero, served clean, with no fresh arrivals
  // helping it along and no life lost anywhere (see the loseLife call
  // sites above, which also drop stageAttemptActive the instant a miss
  // happens). Only checked once the game isn't already showing a
  // life-lost screen, so a miss landing on the same frame as the last
  // customer leaving doesn't collide with the stage-passed screen.
  if (!sim.gameOver && !sim.awaitingContinue) {
    const walkingLanes = new Set(sim.customers.filter((c) => c.status === 'walking').map((c) => c.lane))
    if (!sim.stageAttemptActive && walkingLanes.size >= C.LANE_COUNT) {
      sim.stageAttemptActive = true
      sim.stageAttemptClean = true
    }
    if (sim.stageAttemptActive && sim.stageAttemptClean && !sim.awaitingStageAdvance && sim.customers.length === 0) {
      sim.stageAttemptActive = false
      if (sim.stage < C.STAGE_LANE_CAPACITY.length) {
        // Still have lane-capacity stages left to unlock — show the
        // normal "LEVEL PASSED" screen.
        sim.awaitingStageAdvance = true
      } else {
        // Already at the top lane-capacity stage — a clean full clear
        // here sends the player to a random one of the three bonus rounds
        // instead.
        const bonusMode = pick(['bonusWheel', 'bonusPlates', 'bonusShaker'])
        sim.mode = bonusMode
        if (bonusMode === 'bonusWheel') sim.bonusLevel = createBonusLevelState()
        else if (bonusMode === 'bonusPlates') sim.platesLevel = createPlatesLevelState()
        else sim.shakerLevel = createShakerLevelState()
      }
    }
  }
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

  // Tapping a lane directly jumps straight to it — no need to swipe
  // through the ones in between.
  const goToLane = useCallback((laneIndex) => {
    const sim = simRef.current
    if (sim.gameOver) return
    if (laneIndex < 0 || laneIndex >= C.LANE_COUNT) return
    sim.playerLane = laneIndex
  }, [])

  // Tapping a drink both picks it and pours it in one motion — no
  // separate JERK press. Picking a drink means heading back to the
  // fountain to pour it, so this jumps him straight back home first,
  // wherever he'd run off to, same as the old select-then-press flow did.
  const pourDrink = useCallback((index) => {
    const sim = simRef.current
    if (sim.gameOver) return
    // A life was already lost and the "YOU GOT SPRAYED!" pause is on its
    // way (the recall/spray sequence, or the short sound-and-pause beat
    // for a different lane) — block pouring until it actually shows,
    // otherwise a second mistake in that window can cost a second life
    // before the player has even seen the first one land.
    if (sim.pendingSprayDrinkType !== null || sim.continuePauseInMs !== null) return
    sim.selectedDrink = index
    sim.playerX = C.PLAYER_X
    sim.moveDir = 0
    sim.runTargetX = null
    sim.throwingMs = C.THROW_ANIM_MS

    const lane = sim.playerLane

    // One mug in flight per lane at a time, to keep the prototype simple.
    // No check for a customer actually being there — pouring down an
    // empty lane is allowed, it just sails through and breaks.
    if (sim.mugs.some((m) => m.lane === lane)) return

    sim.mugs.push({
      id: sim.nextId++,
      lane,
      x: sim.playerX,
      speed: (C.OFFSCREEN_X - C.PLAYER_X) / (C.MUG_TRAVEL_MS / 1000),
      drinkType: index,
      color: C.DRINK_TYPES[index].color,
    })
  }, [])

  // Tapping a returning glass directly catches it, wherever it is — no
  // need to be standing in that lane first.
  const grabGlass = useCallback((glassId) => {
    const sim = simRef.current
    if (sim.gameOver) return
    const idx = sim.glasses.findIndex((g) => g.id === glassId)
    if (idx === -1) return
    sim.glasses.splice(idx, 1)
    sim.score += C.POINTS_PER_CAUGHT_GLASS
  }, [])

  // Tapping the hot dog sends the bartender running down the bar to it —
  // the run-over auto-catch above is what actually grabs it once he's
  // close enough.
  const grabBonus = useCallback(() => {
    const sim = simRef.current
    if (sim.gameOver || !sim.bonus) return
    sim.playerLane = sim.bonus.lane
    sim.runTargetX = sim.bonus.x
  }, [])

  const startRun = useCallback((direction) => {
    const sim = simRef.current
    if (sim.gameOver) return
    // Can't fight your way out of being marched back to the counter for
    // the spray — otherwise dragging to run the instant it starts just
    // overwrites the forced recall's moveDir and he never gets there,
    // so the spray (and the pause after it) never actually fires.
    if (sim.pendingSprayDrinkType !== null) return
    sim.runTargetX = null // manual control cancels any auto-run to the hot dog
    sim.moveDir = direction
  }, [])

  const stopRun = useCallback(() => {
    simRef.current.moveDir = 0
  }, [])

  // "YOU DIED" continue button — clears the board for the next life,
  // keeping score, lives, and difficulty progress as they were.
  const continueAfterDeath = useCallback(() => {
    const sim = simRef.current
    if (sim.gameOver || !sim.awaitingContinue) return
    sim.awaitingContinue = false
    sim.customers = []
    sim.mugs = []
    sim.glasses = []
    sim.bonus = null
    sim.playerLane = 0
    sim.playerX = C.PLAYER_X
    sim.moveDir = 0
    sim.runTargetX = null
    sim.pendingSprayDrinkType = null
    // A spray sequence's hold timer can still be silently ticking down in
    // the background if a faster miss (glass/mug) showed its screen
    // first — without clearing it here, it survives this reset and later
    // fires a second, unprompted "YOU GOT SPRAYED!" screen once it hits
    // zero, well after the player already continued from the first one.
    sim.continuePauseInMs = null
    sim.missReason = null
    // Already dropped by the loseLife call site that triggered this
    // screen, but reset defensively — the board's empty again either way.
    sim.stageAttemptActive = false
    // Reset to whatever level the current score is already at, not back
    // to level 1 — losing a life clears the board, not your progress.
    sim.nextSpawnInMs = getLevelForScore(sim.score).spawnIntervalMs
    sim.nextBonusInMs = randomBetween(C.BONUS_SPAWN_INTERVAL_MIN_MS, C.BONUS_SPAWN_INTERVAL_MAX_MS)
  }, [])

  // "LEVEL PASSED" continue button — unlocks the next stage's lane
  // capacity and lets the sim keep running, keeping score, lives, and
  // everything else exactly as they were.
  const advanceStage = useCallback(() => {
    const sim = simRef.current
    if (sim.gameOver || !sim.awaitingStageAdvance) return
    sim.awaitingStageAdvance = false
    sim.stage += 1
    // Passing a level only requires the CUSTOMERS to be gone — a glass or
    // mug can still be mid-return-flight at that instant. Left alone it
    // survives into the new stage, frozen mid-slide over the fresh venue.
    sim.glasses = []
    sim.mugs = []
  }, [])

  // Bonus-round aiming — pull back from the launch anchor, then release
  // to throw. Distances in are all arena-relative percentages, computed
  // by BonusLevel.jsx from its own bounding box.
  const bonusAimStart = useCallback(() => {
    const sim = simRef.current
    const b = sim.bonusLevel
    if (!b || b.scoopState !== 'ready') return
    b.scoopState = 'aiming'
  }, [])

  const bonusAimMove = useCallback((dx, dy) => {
    const sim = simRef.current
    const b = sim.bonusLevel
    if (!b || b.scoopState !== 'aiming') return
    const pull = Math.hypot(dx, dy)
    const clampScale = pull > C.BONUS_MAX_PULL ? C.BONUS_MAX_PULL / pull : 1
    b.aimDX = dx * clampScale
    b.aimDY = dy * clampScale
  }, [])

  const bonusAimEnd = useCallback(() => {
    const sim = simRef.current
    const b = sim.bonusLevel
    if (!b || b.scoopState !== 'aiming') return
    const pull = Math.hypot(b.aimDX, b.aimDY)
    if (pull < C.BONUS_MIN_PULL) {
      // Barely pulled — treat as a cancel, snap back to rest instead of
      // a limp, accidental throw.
      b.scoopState = 'ready'
      b.aimDX = 0
      b.aimDY = 0
      return
    }
    // A slingshot launches opposite the pull direction, at a speed
    // proportional to how far back it was drawn.
    b.vx = -b.aimDX * C.BONUS_LAUNCH_POWER
    b.vy = -b.aimDY * C.BONUS_LAUNCH_POWER
    b.scoopX = C.BONUS_LAUNCH_ANCHOR.x + b.aimDX
    b.scoopY = C.BONUS_LAUNCH_ANCHOR.y + b.aimDY
    b.scoopState = 'flying'
  }, [])

  // Tapping a plate sprays it clean (dirty/dollar — scores and removes
  // it) or, if it's a clean one, ends the round on the spot — a metal
  // cup's forgiving if you miss the color, but a clean plate never is.
  const plateClick = useCallback((plateId) => {
    const sim = simRef.current
    const p = sim.platesLevel
    if (!p || p.ended) return
    const idx = p.plates.findIndex((pl) => pl.id === plateId)
    if (idx === -1) return
    const plate = p.plates[idx]
    p.plates.splice(idx, 1)
    if (plate.kind === 'clean') {
      p.ended = true
      p.resultText = 'THAT ONE WAS CLEAN!'
      p.resultHoldMs = C.PLATES_RESULT_HOLD_MS
      return
    }
    const points = plate.kind === 'dollar' ? C.PLATES_DOLLAR_POINTS : C.PLATES_DIRTY_POINTS
    sim.score += points
    p.popCount++
    p.lastPopKind = plate.kind
  }, [])

  // Shaker-round aiming — pull back from the launch anchor, then release
  // to throw. Identical shape to bonusAimStart/Move/End above; distances
  // are percentages of the full phone-frame (ShakerLevel.jsx is a
  // full-screen arena, unlike the wheel round's own square sub-arena).
  const shakerAimStart = useCallback(() => {
    const sim = simRef.current
    const s = sim.shakerLevel
    if (!s || s.scoopState !== 'ready') return
    s.scoopState = 'aiming'
  }, [])

  const shakerAimMove = useCallback((dx, dy) => {
    const sim = simRef.current
    const s = sim.shakerLevel
    if (!s || s.scoopState !== 'aiming') return
    const pull = Math.hypot(dx, dy)
    const clampScale = pull > C.SHAKER_MAX_PULL ? C.SHAKER_MAX_PULL / pull : 1
    s.aimDX = dx * clampScale
    s.aimDY = dy * clampScale
  }, [])

  const shakerAimEnd = useCallback(() => {
    const sim = simRef.current
    const s = sim.shakerLevel
    if (!s || s.scoopState !== 'aiming') return
    const pull = Math.hypot(s.aimDX, s.aimDY)
    if (pull < C.SHAKER_MIN_PULL) {
      s.scoopState = 'ready'
      s.aimDX = 0
      s.aimDY = 0
      return
    }
    s.vx = -s.aimDX * C.SHAKER_LAUNCH_POWER
    s.vy = -s.aimDY * C.SHAKER_LAUNCH_POWER
    s.scoopX = C.SHAKER_LAUNCH_ANCHOR.x + s.aimDX
    s.scoopY = C.SHAKER_LAUNCH_ANCHOR.y + s.aimDY
    s.scoopState = 'flying'
  }, [])

  // Dev/test shortcuts — jump straight into any bonus round from
  // anywhere mid-game, no need to actually clear two full stages first.
  const skipToBonusWheel = useCallback(() => {
    const sim = simRef.current
    if (sim.gameOver || !sim.started) return
    sim.mode = 'bonusWheel'
    sim.bonusLevel = createBonusLevelState()
  }, [])

  const skipToBonusPlates = useCallback(() => {
    const sim = simRef.current
    if (sim.gameOver || !sim.started) return
    sim.mode = 'bonusPlates'
    sim.platesLevel = createPlatesLevelState()
  }, [])

  const skipToBonusShaker = useCallback(() => {
    const sim = simRef.current
    if (sim.gameOver || !sim.started) return
    sim.mode = 'bonusShaker'
    sim.shakerLevel = createShakerLevelState()
  }, [])

  // Dev shortcut — jumps straight to the stage-2+ soda-fountain venue
  // (see PerspectiveBackdrop.jsx / Lane.jsx, which reskin once
  // state.stage >= 2) without having to actually clear a bonus round.
  const skipToNewVenue = useCallback(() => {
    const sim = simRef.current
    if (sim.gameOver || !sim.started) return
    sim.stage = Math.max(sim.stage, 2)
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

  return {
    state: simRef.current,
    changeLane,
    goToLane,
    pourDrink,
    startRun,
    stopRun,
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
    skipToNewVenue,
  }
}
