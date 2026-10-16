// Renders each venue's music from its public-domain score:
//
//   node tools/music/render-tracks.mjs
//
// Every track is played on the honky-tonk piano from GeneralUser GS
// (sf/GeneralUser-GS.sf2) through FluidSynth (`brew install fluid-synth`),
// loudness-matched, and written to public/audio/music-<venue>.mp3, where the
// web game and the iOS/tvOS apps both pick it up. See scores/SOURCES.md.
import { execFileSync } from 'child_process'
import { existsSync, mkdtempSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import { fileURLToPath } from 'url'
import { readMidi, writeMidi } from './midi.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
const out = path.resolve(here, '../../public/audio')
const soundfont = path.join(here, 'sf/GeneralUser-GS.sf2')
const HONKY_TONK = 3 // General MIDI program

// venue id -> score (see venues.js). The Big Top's is a stand-in until
// "Entry of the Gladiators" is transcribed.
const TRACKS = {
  speakeasy: 'entertainer.mid',
  fountain: 'maple.mid',
  circus: 'winners.mid',
}

if (!existsSync(soundfont)) {
  console.error(`missing ${soundfont} — see scores/SOURCES.md`)
  process.exit(1)
}
const tmp = mkdtempSync(path.join(tmpdir(), 'sodajerk-music-'))
try {
  for (const [venue, score] of Object.entries(TRACKS)) {
    const m = readMidi(path.join(here, 'scores', score))
    const mid = path.join(tmp, `${venue}.mid`), wav = path.join(tmp, `${venue}.wav`)
    writeMidi(mid, m.notes, { program: HONKY_TONK })
    execFileSync('fluidsynth', ['-ni', '-q', '-g', '0.6', '-r', '44100', '-F', wav, soundfont, mid], { stdio: 'ignore' })
    const dest = path.join(out, `music-${venue}.mp3`)
    // trim the silence after the last note so the loop comes straight round
    execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', wav, '-af',
      'areverse,silenceremove=start_periods=1:start_threshold=-55dB,areverse,loudnorm=I=-16:TP=-1.5',
      '-ar', '44100', '-c:a', 'libmp3lame', '-b:a', '128k', dest])
    console.log(`${venue}: ${score} (${m.notes.length} notes, ${m.length.toFixed(0)}s) -> ${path.relative(process.cwd(), dest)}`)
  }
} finally {
  rmSync(tmp, { recursive: true, force: true })
}
