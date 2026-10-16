// Checks the patron model against what was measured from the arcade
// original (docs/TAPPER_MECHANICS.md). Run with `npm test`.
import test from 'node:test'
import assert from 'node:assert/strict'
import * as A from './arcadePatrons.js'
import { DOOR_X, END_OF_BAR_X } from './constants.js'

// Small seeded generator so the distribution checks are repeatable.
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
const span = DOOR_X - END_OF_BAR_X
const near = (actual, expected, tol, msg) =>
  assert.ok(Math.abs(actual - expected) <= tol, `${msg}: ${actual} not within ${tol} of ${expected}`)

test('a burst is the same 11 units on every bar, so a bigger share of a shorter one', () => {
  // The arcade bars are 193/161/129/97 units; the step is 11 on each (a
  // 12-frame burst whose last frame changes state instead of moving).
  A.BAR_UNITS.forEach((len, lane) => {
    near(A.laneGait(lane).stepPct, (11 * span) / len, 1e-9, `lane ${lane} step`)
  })
  assert.ok(A.laneGait(3).stepPct > A.laneGait(0).stepPct * 1.9)
})

test('first-level crossing times are the arcade’s: about 19, 25, 33 and 33 seconds', () => {
  const secs = [0, 1, 2, 3].map((lane) => {
    const g = A.laneGait(lane, 1)
    return ((span / g.stepPct) * (g.burstMs + g.pauseMs)) / 1000
  })
  near(secs[0], 19.0, 0.3, 'top bar')
  near(secs[1], 24.9, 0.3, 'second bar')
  near(secs[2], 32.6, 0.4, 'third bar')
  near(secs[3], 32.8, 0.4, 'bottom bar')
})

test('pace scales time but not distance', () => {
  const slow = A.laneGait(2, 1)
  const quick = A.laneGait(2, 0.25)
  assert.equal(quick.stepPct, slow.stepPct)
  near(quick.burstMs, slow.burstMs / 4, 1e-9, 'burst')
  near(quick.pauseMs, slow.pauseMs / 4, 1e-9, 'pause')
})

test('the pause ramp takes 10% of the starting pause off every 10 s, never below a frame', () => {
  assert.equal(A.pauseRamp(0), 1)
  assert.equal(A.pauseRamp(9999), 1)
  near(A.pauseRamp(10000), 0.9, 1e-9, 'one interval')
  near(A.pauseRamp(35000), 0.7, 1e-9, 'three intervals')
  assert.equal(A.pauseRamp(120000), 0)
  near(A.rampedPauseMs(1000, 120000, 1), A.FRAME_MS, 1e-9, 'floor at one frame')
  near(A.rampedPauseMs(1000, 120000, 0.5), A.FRAME_MS * 0.5, 1e-9, 'floor scales with pace')
})

test('a shove is 39..99 units, averaging about 65', () => {
  const rnd = mulberry32(7)
  let lo = Infinity, hi = -Infinity, sum = 0
  const N = 40000
  for (let i = 0; i < N; i++) {
    const u = A.rollShoveUnits(rnd)
    lo = Math.min(lo, u)
    hi = Math.max(hi, u)
    sum += u
    assert.equal(u % 3, 0, 'always whole frames of 3 units')
  }
  assert.equal(lo, 39)
  assert.equal(hi, 99)
  // 3 * (13 + mean extra), where the extras' weighted mean is 8.75
  near(sum / N, 3 * (13 + 8.75), 0.8, 'mean shove')
})

test('the same shove is a bigger share of a shorter bar', () => {
  assert.ok(A.unitsToPct(60, 3) > A.unitsToPct(60, 0) * 1.9)
  near(A.unitsToPct(193, 0), span, 1e-9, 'a whole top bar is the whole span')
  near(A.unitsToPct(97, 3), span, 1e-9, 'a whole bottom bar is the whole span')
  near(A.shoveSpeedPct(0), (90 * span) / 193, 1e-9, 'shove speed on the top bar')
})

test('drinking: sip pool is the original’s 64 patrons, mean sip about 7 frames', () => {
  assert.equal(A.SIP_FRAMES.length, 64)
  assert.equal(Math.min(...A.SIP_FRAMES), 1)
  assert.equal(Math.max(...A.SIP_FRAMES), 18)
  near(A.MEAN_SIP_FRAMES, 6.9, 0.2, 'mean sip')
  near(A.drinkScale(A.MEAN_SIP_FRAMES), 1, 1e-9, 'average patron drinks the level’s drinkMs')
  assert.ok(A.drinkScale(1) < 0.2 && A.drinkScale(18) > 2.4)
  assert.equal(A.DRINK_PERIODS, 7)
})

test('after the empty goes back he stands 19..34 frames, and starters wait 16..32', () => {
  const rnd = mulberry32(11)
  let lo = Infinity, hi = -Infinity, wlo = Infinity, whi = -Infinity
  for (let i = 0; i < 20000; i++) {
    const t = A.afterThrowMs(rnd) / A.FRAME_MS
    lo = Math.min(lo, t); hi = Math.max(hi, t)
    const w = A.startWaitMs(rnd) / A.FRAME_MS
    wlo = Math.min(wlo, w); whi = Math.max(whi, w)
  }
  near(lo, 19, 1e-6, 'shortest hold')
  near(hi, 34, 1e-6, 'longest hold')
  near(wlo, 16, 1e-6, 'shortest start wait')
  near(whi, 32, 1e-6, 'longest start wait')
})

test('the opening crowd stands staggered in from the door, nearest first', () => {
  for (let lane = 0; lane < 4; lane++) {
    const xs = [0, 1, 2, 3].map((n) => A.startX(lane, n))
    for (let i = 0; i < 3; i++) assert.ok(xs[i] > xs[i + 1], `lane ${lane}: ${xs}`)
    assert.ok(xs[0] < DOOR_X && xs[3] > END_OF_BAR_X)
  }
  near(A.startX(0, 0), DOOR_X - 0.057 * span, 1e-9, 'first patron, top bar')
  assert.equal(A.startX(0, 9), A.startX(0, 3), 'a crowd bigger than four stays at the last spot')
})
