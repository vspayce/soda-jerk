// Drives the real sim (step/startLevel) headlessly and checks the patron
// chain against the arcade model: shove -> drink -> empty back -> hold ->
// pause -> step. Run with `npm test`.
import test from 'node:test'
import assert from 'node:assert/strict'
import { createInitialSim, startLevel, step } from './engine.js'
import * as A from './arcadePatrons.js'
import * as C from './constants.js'
import { getLevel } from './levels.js'

const DT = 1 / 60

function mulberry32(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Runs fn with Math.random replaced by a seeded generator.
function seeded(seed, fn) {
  const real = Math.random
  Math.random = mulberry32(seed)
  try {
    return fn()
  } finally {
    Math.random = real
  }
}

// A level-1 sim with exactly one patron, in `lane` at `x`, plain and standing
// ready to be served: no one else on the bar, nobody waiting to come in.
function lone(lane, x, level = 1) {
  const sim = createInitialSim()
  sim.started = true
  sim.level = level
  startLevel(sim)
  const c = sim.customers.find((p) => p.lane === lane)
  assert.ok(c, `level ${level} has a patron on bar ${lane}`)
  // A gait of exactly 1: the stride was drawn from the random one at spawn,
  // so it has to be set again to match.
  const g = A.laneGait(lane, getLevel(level).travelMs / getLevel(1).travelMs)
  Object.assign(c, {
    x, status: 'walking', pauseMs: 0, patronType: 0, drinkType: 0,
    gait: 1, stepLen: g.stepPct, stepLeft: g.stepPct, stepMs: 0,
  })
  sim.customers = [c]
  sim.roster = [0, 0, 0, 0]
  sim.reentries = []
  sim.nextBonusInMs = Infinity
  sim.playerLane = lane
  return { sim, c }
}

const serve = (sim, c) =>
  sim.mugs.push({ id: 9000 + sim.nextId++, lane: c.lane, x: c.x - 1, speed: 100, drinkType: c.drinkType })

test('the opening crowd stands where the arcade puts it, and waits 16-32 frames to set off', () => {
  seeded(3, () => {
    const sim = createInitialSim()
    sim.started = true
    startLevel(sim)
    const seen = [0, 0, 0, 0]
    for (const c of sim.customers) {
      const n = seen[c.lane]++
      assert.ok(Math.abs(c.x - A.startX(c.lane, n)) <= 1.5 + 1e-9, `bar ${c.lane} patron ${n} at ${c.x}`)
      assert.ok(c.pauseMs >= 16 * A.FRAME_MS - 1e-6 && c.pauseMs <= 32 * A.FRAME_MS + 1e-6, `wait ${c.pauseMs}`)
    }
  })
})

test('a drink shoves a random arcade distance, and a bigger share of the shorter bars', () => {
  seeded(5, () => {
    const avg = []
    for (let lane = 0; lane < 4; lane++) {
      const lo = A.unitsToPct(39, lane)
      const hi = A.unitsToPct(99, lane)
      let sum = 0
      let n = 0
      let ejected = 0
      for (let trial = 0; trial < 400; trial++) {
        const { sim, c } = lone(lane, 30)
        serve(sim, c)
        step(sim, DT)
        assert.equal(c.status, 'toasting', `bar ${lane} trial ${trial}`)
        if (c.pushTargetX > C.DOOR_X) {
          // Carried out the door: only possible if 30 + shove reaches it.
          ejected++
          assert.ok(30 + hi >= C.DOOR_X)
          continue
        }
        const dist = c.pushTargetX - c.x // from where he stood when it landed
        assert.ok(dist >= lo - 1e-9 && dist <= hi + 1e-9, `bar ${lane}: shove ${dist} outside ${lo}..${hi}`)
        sum += dist
        n++
      }
      avg.push(n ? sum / n : Infinity)
      // A bottom-bar shove is a big share of that short bar: from x=30 it
      // carries him out the door whenever it's 81 units or more — the top
      // 21% of the arcade's shove weights, so about 84 of 400.
      if (lane === 3) assert.ok(ejected > 55 && ejected < 115, `bottom bar ejected ${ejected}/400`)
      if (lane === 0) assert.equal(ejected, 0, 'a top-bar shove from 30 never reaches the door')
    }
    assert.ok(avg[0] < avg[1] && avg[1] < avg[2], `shoves grow down the bars: ${avg}`)
  })
})

test('the mom-and-son pair still shifts less per drink', () => {
  seeded(9, () => {
    const { sim, c } = lone(0, 30)
    c.patronType = 1
    serve(sim, c)
    step(sim, DT)
    const dist = c.pushTargetX - c.x
    assert.ok(dist <= A.unitsToPct(99, 0) * C.CUSTOMER_PUSH_RESISTANCE[1] + 1e-9, `${dist}`)
  })
})

test('the whole chain: shove, drink his own sip, empty goes back, he holds then stands', () => {
  seeded(21, () => {
    const lane = 0
    const { sim, c } = lone(lane, 30)
    const lvl = getLevel(sim.level)
    serve(sim, c)
    step(sim, DT)
    assert.equal(c.status, 'toasting')

    let t = 0
    const tick = (until, label) => {
      while (!until()) {
        step(sim, DT)
        t += DT
        assert.ok(t < 30, `stuck waiting for ${label}`)
      }
    }
    tick(() => c.status === 'leaving-happy', 'shove')
    tick(() => c.status === 'drinking', 'drinking')
    // He drinks for the level's drinkMs scaled by his own sip.
    const expectDrink = lvl.drinkMs * A.drinkScale(c.sipFrames)
    assert.ok(Math.abs(c.drinkMs - expectDrink) <= 1000 * DT + 1, `drink ${c.drinkMs} vs ${expectDrink}`)

    tick(() => sim.glasses.length === 1, 'the empty')
    // The empty has gone back; he holds the throw and recovers (19-34 frames)
    // and then stands a pause of his own bar's length before stepping.
    assert.equal(c.status, 'walking')
    assert.ok(c.pauseMs >= 19 * A.FRAME_MS - 1, `pause after the empty ${c.pauseMs}`)
    assert.ok(c.pauseMs <= 34 * A.FRAME_MS + c.pauseBaseMs * c.gait * 1.1 + 1, `pause after the empty ${c.pauseMs}`)

    // And he can be served again while he stands there.
    const x0 = c.x
    serve(sim, c)
    step(sim, DT)
    assert.equal(c.status, 'toasting', 'servable while holding the throw')
    assert.ok(c.pushTargetX > x0)
  })
})

test('his sip is his own for life — it comes back in with him', () => {
  seeded(33, () => {
    const { sim, c } = lone(3, 85) // bottom-bar shoves are 32%+ of the bar: out the door
    const sip = c.sipFrames
    serve(sim, c)
    step(sim, DT) // toasting; bottom-bar shoves nearly always carry him out
    for (let i = 0; i < 600 && sim.reentries.length === 0; i++) step(sim, DT)
    assert.equal(sim.reentries.length, 1)
    assert.equal(sim.reentries[0].sipFrames, sip)
  })
})

test('the pause shrinks as the level wears on: 10% of its start every 10 s', () => {
  seeded(41, () => {
    const mean = (levelMs) => {
      let sum = 0
      const N = 200
      for (let i = 0; i < N; i++) {
        const { sim, c } = lone(1, 60)
        sim.levelMs = levelMs
        // walk one burst: until a pause starts
        for (let f = 0; f < 600 && !(c.pauseMs > 0); f++) {
          sim.levelMs = levelMs // hold the ramp still
          step(sim, DT)
        }
        sum += c.pauseMs
      }
      return sum / N
    }
    const fresh = mean(0)
    const later = mean(40000) // four intervals: 60% of the start
    assert.ok(Math.abs(later / fresh - 0.6) < 0.05, `ratio ${later / fresh}`)
    const spent = mean(200000) // long past the end of the ramp: just a frame
    assert.ok(spent < A.FRAME_MS * 2, `pause ${spent}`)
  })
})

test('each bar gives its own cadence at level 1: burst length and stand', () => {
  seeded(51, () => {
    const g = [0, 1, 2, 3].map((lane) => {
      const { sim, c } = lone(lane, 60)
      let burstMs = 0
      let walked = 0
      const x0 = c.x
      while (!(c.pauseMs > 0) && burstMs < 5000) {
        step(sim, DT)
        burstMs += DT * 1000
      }
      walked = x0 - c.x
      return { burstMs, walked, pause: c.pauseMs }
    })
    for (let lane = 0; lane < 4; lane++) {
      const want = A.laneGait(lane, 1)
      assert.ok(Math.abs(g[lane].walked - want.stepPct) < 0.25, `bar ${lane} step ${g[lane].walked} vs ${want.stepPct}`)
      assert.ok(Math.abs(g[lane].burstMs - want.burstMs) <= 40, `bar ${lane} burst ${g[lane].burstMs} vs ${want.burstMs}`)
      assert.ok(Math.abs(g[lane].pause / want.pauseMs - 1) <= 0.15, `bar ${lane} stand ${g[lane].pause} vs ${want.pauseMs}`)
    }
    assert.ok(g[0].pause < g[1].pause && g[1].pause < g[2].pause && g[2].pause < g[3].pause)
  })
})

test('a faster level stands and steps in proportion', () => {
  seeded(61, () => {
    const slow = lone(2, 60, 1)
    const fast = lone(2, 60, 8)
    const pace = getLevel(8).travelMs / getLevel(1).travelMs
    assert.ok(pace < 0.5)
    assert.ok(Math.abs(fast.c.pauseBaseMs / slow.c.pauseBaseMs - pace) < 1e-9)
    assert.equal(fast.c.stepLen, slow.c.stepLen, 'same distance, less time')
  })
})

test('a patron coming in never stands about behind the door, where he can’t be seen', () => {
  // He's an invisible patron the level is still waiting on, so a long stand
  // there reads as a cleared bar that won't advance.
  for (const level of [1, 5, 9]) {
    seeded(70 + level, () => {
      const sim = createInitialSim()
      sim.started = true
      sim.level = level
      startLevel(sim)
      sim.customers = []
      sim.reentries = []
      sim.roster = [1, 1, 1, 1]
      sim.nextBonusInMs = Infinity
      const hiddenMs = [0, 0, 0, 0]
      const seen = new Set()
      for (let f = 0; f < 60 * 12; f++) {
        // keep the bar from clearing and tipping the level over
        step(sim, DT)
        for (const c of sim.customers) {
          seen.add(c.id)
          if (c.x > C.DOOR_X) {
            assert.equal(c.pauseMs, 0, `level ${level} bar ${c.lane}: standing in the doorway at x=${c.x}`)
            hiddenMs[c.lane] += DT * 1000
          }
        }
      }
      assert.equal(seen.size, 4, 'all four came in')
      for (const ms of hiddenMs) assert.ok(ms < 1500, `level ${level}: ${ms} ms out of sight`)
    })
  }
})

test('the show: with only watchers left the act wraps up, so the level is never held open for the whole thing', () => {
  seeded(81, () => {
    const { sim, c } = lone(2, 50)
    Object.assign(c, { status: 'watching', watchMs: C.SHOW_MS })
    step(sim, DT)
    assert.ok(c.watchMs <= C.SHOW_WRAP_MS, `watchMs ${c.watchMs}`)
  })
})

test('the show carries on in full while anyone else is on the bar or still to come in', () => {
  seeded(82, () => {
    // another patron still walking
    let { sim, c } = lone(2, 50)
    Object.assign(c, { status: 'watching', watchMs: C.SHOW_MS })
    const other = { ...c, id: 9999, lane: 0, status: 'walking', pauseMs: 0, x: 60 }
    sim.customers.push(other)
    step(sim, DT)
    assert.ok(c.watchMs > C.SHOW_MS - 100, `watcher cut short with a patron still walking: ${c.watchMs}`)

    // someone still waiting to walk in
    ;({ sim, c } = lone(2, 50))
    Object.assign(c, { status: 'watching', watchMs: C.SHOW_MS })
    sim.roster = [0, 1, 0, 0]
    step(sim, DT)
    assert.ok(c.watchMs > C.SHOW_MS - 100, `watcher cut short with someone to come in: ${c.watchMs}`)
  })
})

test('coming out of the show he stands for the turn back, then can be served and the level passes', () => {
  seeded(83, () => {
    const { sim, c } = lone(2, 50)
    Object.assign(c, { status: 'watching', watchMs: C.SHOW_MS })
    let t = 0
    while (c.status === 'watching') {
      step(sim, DT)
      t += DT
      assert.ok(t < 5, 'the act never ended')
    }
    assert.ok(t <= (C.SHOW_WRAP_MS + 100) / 1000, `waited ${t}s for the act`)
    assert.equal(c.status, 'walking')
    assert.ok(c.pauseMs >= C.SHOW_TURN_MS - 1, `turn back ${c.pauseMs}`)
    const x = c.x
    for (let i = 0; i < (C.SHOW_TURN_MS / 1000 / DT) - 2; i++) step(sim, DT)
    assert.equal(c.x, x, 'he stays put while he turns')

    // served straight after the turn, he's shoved out and the level passes
    c.x = 85
    serve(sim, c)
    for (let i = 0; i < 60 * 8 && !sim.awaitingStageAdvance; i++) step(sim, DT)
    assert.ok(sim.awaitingStageAdvance, 'level passed')
  })
})

test('smoke: a minute of untended play never produces a NaN or a stuck patron', () => {
  seeded(77, () => {
    const sim = createInitialSim()
    sim.started = true
    startLevel(sim)
    for (let f = 0; f < 60 * 60; f++) {
      if (sim.awaitingContinue) sim.awaitingContinue = false
      if (sim.gameOver) break
      step(sim, DT)
      for (const c of sim.customers) {
        assert.ok(Number.isFinite(c.x) && Number.isFinite(c.pauseMs) && Number.isFinite(c.speed), JSON.stringify(c))
      }
    }
  })
})
