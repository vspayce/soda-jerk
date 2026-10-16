// A small Standard MIDI File reader: notes (with times in seconds, after
// every tempo change) and the tempo map. Enough for the scores in this
// folder; no running-status quirks beyond the standard ones.
import { readFileSync, writeFileSync } from 'fs'

export function readMidi(path) {
  const b = readFileSync(path)
  let p = 0
  const u32 = () => (b[p++] << 24) | (b[p++] << 16) | (b[p++] << 8) | b[p++]
  const u16 = () => (b[p++] << 8) | b[p++]
  const vlq = () => { let v = 0, c; do { c = b[p++]; v = (v << 7) | (c & 0x7f) } while (c & 0x80); return v }
  if (b.toString('ascii', 0, 4) !== 'MThd') throw new Error('not a MIDI file')
  p = 8
  const format = u16(), ntracks = u16(), division = u16()
  const events = [] // { tick, track, type, ... }
  for (let t = 0; t < ntracks; t++) {
    while (b.toString('ascii', p, p + 4) !== 'MTrk') p += 8 + ((b[p + 4] << 24) | (b[p + 5] << 16) | (b[p + 6] << 8) | b[p + 7])
    p += 4
    const len = u32(), end = p + len
    let tick = 0, status = 0
    while (p < end) {
      tick += vlq()
      let s = b[p]
      if (s & 0x80) { p++; status = s } else s = status
      const kind = s & 0xf0, ch = s & 0x0f
      if (s === 0xff) {
        const type = b[p++], l = vlq()
        if (type === 0x51) events.push({ tick, track: t, type: 'tempo', usPerQ: (b[p] << 16) | (b[p + 1] << 8) | b[p + 2] })
        p += l
      } else if (s === 0xf0 || s === 0xf7) { p += vlq() }
      else if (kind === 0x90 || kind === 0x80) {
        const note = b[p++], vel = b[p++]
        events.push({ tick, track: t, ch, type: kind === 0x90 && vel > 0 ? 'on' : 'off', note, vel })
      } else if (kind === 0xc0 || kind === 0xd0) p += 1
      else p += 2
    }
    p = end
  }
  events.sort((a, b) => a.tick - b.tick || (a.type === 'off' ? -1 : 1))
  // ticks -> seconds through the tempo map
  let usPerQ = 500000, lastTick = 0, lastSec = 0
  const sec = (tick) => lastSec + ((tick - lastTick) * usPerQ) / division / 1e6
  const open = new Map(), notes = []
  for (const e of events) {
    const s = sec(e.tick)
    if (e.type === 'tempo') { lastSec = s; lastTick = e.tick; usPerQ = e.usPerQ; continue }
    const key = `${e.track}:${e.ch}:${e.note}`
    if (e.type === 'on') { open.set(key, { start: s, note: e.note, vel: e.vel, track: e.track }) }
    else if (open.has(key)) { const n = open.get(key); open.delete(key); notes.push({ ...n, end: s }) }
  }
  notes.sort((a, b) => a.start - b.start)
  return { format, division, notes, length: Math.max(0, ...notes.map((n) => n.end)) }
}

// Writes notes ({ start, end, note, vel } in seconds) as a format-0 MIDI
// file on one channel with the given General MIDI program (0 = grand piano,
// 3 = honky-tonk, 16 = drawbar organ…), at a fixed tempo so seconds map
// straight to ticks.
export function writeMidi(path, notes, { program = 0, channel = 0 } = {}) {
  const TPQ = 1000, US_PER_Q = 500000 // 1 tick = 0.5ms
  const tick = (s) => Math.round((s * 1e6 / US_PER_Q) * TPQ)
  const evs = []
  for (const n of notes) {
    evs.push({ t: tick(n.start), d: [0x90 | channel, n.note, Math.max(1, n.vel)] })
    evs.push({ t: tick(n.end), d: [0x80 | channel, n.note, 0] })
  }
  evs.sort((a, b) => a.t - b.t || (a.d[0] & 0xf0) - (b.d[0] & 0xf0))
  const vlq = (v) => { const out = [v & 0x7f]; while ((v >>= 7)) out.unshift((v & 0x7f) | 0x80); return out }
  const body = [0, 0xff, 0x51, 3, US_PER_Q >> 16, (US_PER_Q >> 8) & 0xff, US_PER_Q & 0xff, 0, 0xc0 | channel, program]
  let last = 0
  for (const e of evs) { body.push(...vlq(e.t - last), ...e.d); last = e.t }
  body.push(0, 0xff, 0x2f, 0)
  const head = [0x4d, 0x54, 0x68, 0x64, 0, 0, 0, 6, 0, 0, 0, 1, TPQ >> 8, TPQ & 0xff]
  const trk = [0x4d, 0x54, 0x72, 0x6b, (body.length >>> 24) & 0xff, (body.length >> 16) & 0xff, (body.length >> 8) & 0xff, body.length & 0xff]
  writeFileSync(path, Buffer.from([...head, ...trk, ...body]))
}
