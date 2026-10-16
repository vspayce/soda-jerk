// Patron behaviour as the arcade original runs it. Every number here was
// measured from the original's own running code and data tables — see
// docs/TAPPER_MECHANICS.md for how, and for what was left out.
//
// Pure functions of constants and a random source, no React and no sim
// state, so the whole model can be checked headlessly (arcadePatrons.test.js).
//
// The arcade counts in 30 Hz frames and in its own bar units (256 across).
// This file keeps those units and converts at the edge:
//   - time:     frames  -> ms     (FRAME_MS)
//   - distance: units   -> lane % (unitsToPct), per lane, because the
//     arcade's bars get shorter going down and the same shove or stride is a
//     bigger share of a short bar. Soda Jerk draws all four bars the same
//     length, so that proportion is carried over by scaling, not geometry.
import { DOOR_X, END_OF_BAR_X } from './constants.js'

export const FRAME_MS = 1000 / 30

// Bar length, top to bottom (units). Lower bars are shorter.
export const BAR_UNITS = [193, 161, 129, 97]

// A patron advances in bursts: STEP_FRAMES frames long, a unit a frame, then
// stands for a pause that depends on the bar (and so is shortest on the
// longest bar). The last frame of a burst changes state rather than moving,
// so a 12-frame burst covers 11 units. Frames, mean of each bar's four
// patrons.
export const STEP_UNITS = 11
export const STEP_FRAMES = 12
export const LANE_PAUSE_FRAMES = [20.5, 39, 71.5, 99.5]

// The crowd gets impatient: every PAUSE_RAMP_EVERY_MS into a level, each
// pause shrinks by PAUSE_RAMP_FRACTION of what it started as (never below a
// single frame). Dawdle for long enough and everyone is walking flat out.
export const PAUSE_RAMP_EVERY_MS = 10000
export const PAUSE_RAMP_FRACTION = 0.1

// A drink shoves the patron back at SHOVE_UNITS_PER_FRAME for a random
// number of frames: SHOVE_BASE_FRAMES plus 0..20 extra, those extras weighted
// by how often the original's own random-number routine hands each one out
// (per mille; it thins out toward the top of the range).
export const SHOVE_UNITS_PER_FRAME = 3
export const SHOVE_BASE_FRAMES = 13
export const SHOVE_EXTRA_WEIGHTS = [
  34, 57, 64, 63, 57, 53, 53, 63, 63, 63, 53, 59, 52, 57, 43, 30, 23, 28, 33, 23, 29,
]

// Drinking takes DRINK_PERIODS sips of a length that belongs to the patron
// (frames; 1 is a gulp, 18 is savouring it). This is every patron template
// in the original, all four venues pooled — drawing from it keeps the mix.
export const DRINK_PERIODS = 7
export const SIP_FRAMES = [
  1, 6, 14, 9, 3, 5, 16, 1, 9, 6, 2, 10, 7, 5, 3, 15, //  venue 1
  7, 5, 2, 1, 3, 2, 7, 9, 3, 9, 2, 13, 5, 3, 10, 18, //   venue 2
  11, 2, 6, 8, 4, 7, 1, 13, 2, 13, 6, 4, 12, 5, 7, 3, //  venue 3
  9, 2, 5, 11, 2, 7, 10, 13, 1, 10, 6, 12, 11, 8, 2, 14, // venue 4
]
export const MEAN_SIP_FRAMES = SIP_FRAMES.reduce((a, b) => a + b, 0) / SIP_FRAMES.length

// After the empty goes back the patron holds the pose for THROW_FRAMES
// (5..20) and then recovers for RECOVER_FRAMES. He can be served again
// throughout, but won't step until both are over and a normal pause is too.
export const THROW_FRAMES_MIN = 5
export const THROW_FRAMES_MAX = 20
export const RECOVER_FRAMES = 14

// Patrons already at the bar when a level opens wait this long (frames,
// inclusive) before the first step — so they never all set off together.
export const START_WAIT_FRAMES_MIN = 16
export const START_WAIT_FRAMES_MAX = 32

// Where the opening crowd stands, as a fraction of the bar in from the door,
// per bar (top to bottom) and per patron (nearest the door first). They
// start staggered along the door end, not queued at it.
export const START_FRACTIONS = [
  [0.057, 0.135, 0.228, 0.3],
  [0.068, 0.168, 0.267, 0.366],
  [0.062, 0.186, 0.31, 0.434],
  [0.093, 0.227, 0.381, 0.474],
]

// How much of the arcade's lane-to-lane difference to keep, 0..1. At 1 the
// bars play exactly in the arcade's proportions (top bar quick with small
// shoves, bottom bar slow with huge ones); at 0 every bar plays like the
// average of the four. It's a dial, not a measurement.
export const LANE_CHARACTER = 1

const lastLane = BAR_UNITS.length - 1
const clampLane = (lane) => Math.min(Math.max(lane | 0, 0), lastLane)
const span = () => DOOR_X - END_OF_BAR_X

function randInt(lo, hi, rnd) {
  return lo + Math.floor(rnd() * (hi - lo + 1))
}

function weightedIndex(weights, rnd) {
  let r = rnd() * weights.reduce((a, b) => a + b, 0)
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i]
    if (r < 0) return i
  }
  return weights.length - 1
}

const MEAN_BAR_UNITS = BAR_UNITS.reduce((a, b) => a + b, 0) / BAR_UNITS.length
const MEAN_PAUSE_FRAMES = LANE_PAUSE_FRAMES.reduce((a, b) => a + b, 0) / LANE_PAUSE_FRAMES.length

// Bar length as this lane's share of the average bar, eased toward 1 by
// LANE_CHARACTER.
function barScale(lane) {
  const real = BAR_UNITS[clampLane(lane)] / MEAN_BAR_UNITS
  return 1 + (real - 1) * LANE_CHARACTER
}

// Arcade units -> lane %, for a distance along this lane's bar.
export function unitsToPct(units, lane) {
  return (units * span()) / (MEAN_BAR_UNITS * barScale(lane))
}

// How a patron on this lane walks at the given pace (1 = the first level's;
// smaller is quicker): the distance of each burst, how long it takes, and
// how long he stands afterwards before the next one.
export function laneGait(lane, pace = 1) {
  const l = clampLane(lane)
  const pauseFrames = MEAN_PAUSE_FRAMES + (LANE_PAUSE_FRAMES[l] - MEAN_PAUSE_FRAMES) * LANE_CHARACTER
  return {
    stepPct: unitsToPct(STEP_UNITS, l),
    burstMs: STEP_FRAMES * FRAME_MS * pace,
    pauseMs: pauseFrames * FRAME_MS * pace,
  }
}

// Fraction of its starting length a pause has shrunk to after `levelMs` of
// play in the level. Floors at one frame's worth, applied by the caller via
// rampedPauseMs.
export function pauseRamp(levelMs) {
  const steps = Math.floor(Math.max(0, levelMs) / PAUSE_RAMP_EVERY_MS)
  return Math.max(0, 1 - PAUSE_RAMP_FRACTION * steps)
}

export function rampedPauseMs(basePauseMs, levelMs, pace = 1) {
  return Math.max(FRAME_MS * pace, basePauseMs * pauseRamp(levelMs))
}

// One shove, in arcade units.
export function rollShoveUnits(rnd = Math.random) {
  return SHOVE_UNITS_PER_FRAME * (SHOVE_BASE_FRAMES + weightedIndex(SHOVE_EXTRA_WEIGHTS, rnd))
}

export function shovePct(lane, rnd = Math.random) {
  return unitsToPct(rollShoveUnits(rnd), lane)
}

// How fast the shove slides, lane % a second.
export function shoveSpeedPct(lane) {
  return unitsToPct(SHOVE_UNITS_PER_FRAME * 30, lane)
}

export function rollSipFrames(rnd = Math.random) {
  return SIP_FRAMES[Math.floor(rnd() * SIP_FRAMES.length)]
}

// A patron's drinking time as a multiple of the level's drinkMs: the level
// sets the average, the patron's sip decides where he lands around it.
export function drinkScale(sipFrames) {
  return sipFrames / MEAN_SIP_FRAMES
}

// Time standing after the empty goes back, before the pause proper.
export function afterThrowMs(rnd = Math.random) {
  return (randInt(THROW_FRAMES_MIN, THROW_FRAMES_MAX, rnd) + RECOVER_FRAMES) * FRAME_MS
}

export function startWaitMs(rnd = Math.random) {
  return randInt(START_WAIT_FRAMES_MIN, START_WAIT_FRAMES_MAX, rnd) * FRAME_MS
}

// x (lane %) where the n'th opening patron on this bar stands.
export function startX(lane, n) {
  const row = START_FRACTIONS[clampLane(lane)]
  const frac = row[Math.min(n, row.length - 1)]
  return DOOR_X - frac * span()
}
