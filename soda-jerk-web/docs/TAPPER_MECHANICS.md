# Tapper mechanics, as the arcade runs them

What the original does, worked out by running its program ROM in an emulator
harness and reading its code and data tables. These are numbers and rules —
no ROM bytes or code are copied into this repo, and the ROM itself isn't in it.

Each fact is tagged with how it's known:

- **measured** — watched happening in the running ROM (frame-by-frame traces)
- **table** — read straight out of a data table in the ROM
- **code** — read from the disassembly but not exercised in a run
- **not checked** — deliberately left unverified

What Soda Jerk took from this is in [What Soda Jerk uses](#what-soda-jerk-uses).

## Basics

- Z80 at 2.5 MHz; the game advances in **30 Hz frames** (measured: the game
  clock rolls over every 30 frames). Everything below counts frames; 1 frame
  = 33.3 ms.
- Positions are one byte across the bar ("units", 0–255). Y is a separate
  byte; four bars sit 48 units apart. (measured)
- Randomness comes from one routine, `rand(n)`, that returns **0 to n
  inclusive**, close to flat but thinning toward the top of the range.
  Sampled 4,000 times each: `rand(20)` mean 8.75, `rand(15)` mean 7.0,
  `rand(16)` mean 7.8. (measured)

## The bars (table)

Four bars, top to bottom. Each is shorter than the one above, by 16 units
off both ends:

| bar | y  | door end (left) | tap end (right) | length |
|-----|----|-----------------|-----------------|--------|
| 0   | 48 | 8               | 201             | 193    |
| 1   | 96 | 24              | 185             | 161    |
| 2   | 144| 40              | 169             | 129    |
| 3   | 192| 56              | 153             | 97     |

## The bartender

Controls (active-low on port 1, measured by pressing each bit):

| bit | does |
|-----|------|
| 0 | run right along the bar |
| 1 | run left |
| 2 | up one bar |
| 3 | down one bar |
| 4 | tap |

- Running: **2 units a frame**. Reach (measured): bar 0 runs 9–215, bar 1
  25–199, bar 2 41–183, bar 3 57–167.
- Changing bar takes **6 frames**. Whether it wraps top-to-bottom: not checked.
- **Pouring: hold the tap 5 frames and the mug is full.** Let go sooner and
  nothing is thrown. Hold longer and nothing changes — no overfill. Let go
  with a full mug and it leaves the next frame. (measured)

## Mugs

- A thrown mug goes **5 units a frame**, with a 6-frame spin animation.
  (measured)
- A mug hits a patron in its bar when the mug is within **-16 to +8 units**
  of the patron, and only while he's standing, walking, or in the two
  after-throw states below — not while he's being shoved back or drinking.
  (code)
- An empty comes back at **1 unit a frame** at the start (measured), rising
  by 1 at the "mug-speed bump" interval in the difficulty table (110 s on
  row 3) up to 4, and only while none are sliding. (code)
- The bartender **catches an empty by being within 15 units of it** in both
  x and y — no button. A `$` tip is collected the same way. (code)
- A thrown mug that reaches the door end with nobody there **costs a life**
  and restarts the level (measured: lives 3→2). An empty that runs off the
  tap end does the same. (code)

## Patrons

### The cycle (measured; bar 2, first level)

| state | what happens | length |
|-------|--------------|--------|
| wait | stands still | the bar's **pause**, below |
| walk | advances | **12 frames** long, a unit a frame, **11 units** (the last frame changes state instead of moving) |
| shoved | knocked back toward the door | **3 units a frame** for `13 + rand(20)` frames |
| drinking | stands, drinks | **7 × his sip** frames |
| throw | the empty appears at his x + 16 and starts back; he holds the pose | `5 + rand(15)` frames |
| recover | still | **14 frames** |
| wait | → the pause again | |

A first-level run, for scale: hit at x=130, shoved 36 units back to x=91,
drank for 63 frames, threw the empty 6 frames later, recovered for 14, then
stood the bar's pause of 73 frames before walking again.

Things that are easy to miss:

- He can be **served again** while holding the throw and recovering — those
  count as vulnerable.
- Nothing about the shove depends on the bar's length: the same 39–99 units
  on every bar. That's a small shove on the 193-unit top bar and nearly the
  whole of the 97-unit bottom one.
- A shove that carries him past the door end removes him: he **leaves**,
  scores, and a replacement is scheduled (see below).
- A patron who walks past the tap end of his bar costs a life (code), and
  the level restarts with its opening crowd (measured, on a missed mug).

### Pause per bar (table)

Each bar has its own pause between bursts — short on the long top bar,
long on the short bottom one:

| bar | pause (frames) | crossing time, first level |
|-----|----------------|----------------------------|
| 0   | 19–22 (mean 20.5) | 19 s |
| 1   | 37–41 (39)        | 25 s |
| 2   | 70–73 (71.5)      | 33 s |
| 3   | 98–101 (99.5)     | 33 s |

Four patrons per bar, a frame or two apart in pause. Crossing time = bar
length ÷ 11 bursts × (12 + pause) frames.

### The crowd gets impatient (measured)

A timer takes a fixed bit off every pause: 2, 4, 7 and 10 frames on bars
0–3 — about **10% of the starting pause** each time — every **300 frames
(10 s)**, never below 1. After about 100 s of one level everyone is walking
flat out. Pauses start fresh each level.

### Drinking (table)

A patron's sip is fixed, one of 1–18 frames, and drinking is 7 sips. Across
all 64 patron templates the mean sip is 6.9 frames (48 frames, 1.6 s), the
spread is 7 frames (a gulp) to 126 (savouring).

### Starting a level (table, measured)

- The level's patrons are placed all at once, not walked in. Fractions of a
  bar in from the door, nearest first:
  bar 0: 5.7, 13.5, 22.8, 30.0% · bar 1: 6.8, 16.8, 26.7, 36.6% ·
  bar 2: 6.2, 18.6, 31.0, 43.4% · bar 3: 9.3, 22.7, 38.1, 47.4%
- Each waits `16 + rand(16)` frames before his first step.

## Levels and difficulty

- **Patrons per bar** (levels counted from 0; the table stops at 9):

  | level | bar 0 | bar 1 | bar 2 | bar 3 | total |
  |-------|-------|-------|-------|-------|-------|
  | 0 | 1 | 1 | 1 | 1 | 4 |
  | 1 | 2 | 2 | 2 | 2 | 8 |
  | 2 | 3 | 3 | 3 | 2 | 11 |
  | 3, 5 | 4 | 3 | 3 | 2 | 12 |
  | 4, 6 | 4 | 4 | 3 | 3 | 14 |
  | 7 | 4 | 4 | 4 | 3 | 15 |
  | 8+ | 4 | 4 | 4 | 4 | 16 |

- **The level ends** when no patron is left on the bar. A patron shoved out
  is replaced after `base + 16 × level` frames (level capped at 11), so a
  slow clear meets reinforcements. `base` is the row's first column (285 on
  row 3) for the first five levels. From level 5 it's the "respawn from lvl
  5" column (45), except that every "wave every" frames (450 on row 3) it
  jumps to the first column + 90 for 510 frames, then drops back: bursts of
  quick reinforcements with a lull between. (code)
- **Theme** repeats every 13 levels: levels 0–1 the saloon, 2–4 the sports
  bar, 5–8 the punk bar, 9–12 the alien bar. A **bonus round** follows each
  theme (after levels 1, 4, 8 and 12). (code)
- **Difficulty** is one operator setting, fixed for the game; I saw 3 of 9
  with every switch at its default. Nine rows, in frames:

  | row | base respawn | pause ramp every | mug-speed bump every | walk-speed bump every | respawn from lvl 5 | wave every |
  |-----|--------------|------------------|----------------------|-----------------------|--------------------|-----------|
  | 1 | 420 | 360 | 5400 | 6300 | 120 | 150 |
  | 2 | 360 | 330 | 4500 | 5400 | 90 | 300 |
  | 3 | 285 | 300 | 3300 | 4050 | 45 | 450 |
  | 4 | 270 | 285 | 3150 | 3900 | 36 | 540 |
  | 5 | 260 | 285 | 3000 | 3750 | 30 | 660 |
  | 6 | 255 | 280 | 2850 | 3450 | 27 | 750 |
  | 7 | 254 | 275 | 2700 | 3150 | 25 | 840 |
  | 8 | 245 | 245 | 2250 | 3000 | 23 | 870 |
  | 9 | 235 | 240 | 2250 | 2700 | 23 | 930 |

  A "walk-speed bump" raises the walk from 1 to 2 units a frame (and on) after
  that long in one level — about 135 s on row 3, so it rarely fires.

## Scoring (table)

- A patron leaving: **50 / 75 / 100 / 150** for the saloon, sports, punk
  and alien bars.
- Catching an empty: **100**. Collecting a tip: **1,500**.
- Lives at the start come from an operator setting (3 here). The extra-life
  thresholds: not checked.

## What Soda Jerk uses

Ported (see `src/game/arcadePatrons.js`, with its tests):

- the burst-and-pause walk, per bar, scaled by the level's pace
- the shrinking pause
- the random shove and its per-bar proportions
- each patron's own sip, and drinking time scaled around the level's `drinkMs`
- holding the throw and recovering before the pause, still servable
- where the opening crowd stands and when it first moves
- the 50/100/150 oust scoring and 100 for an empty were already in

Not ported, and why:

- **Bar lengths.** Soda Jerk draws four equal bars. The arcade's lane
  differences are carried by scaling (`LANE_CHARACTER` in `arcadePatrons.js`
  dials it from "the arcade's proportions" to "every bar the average").
- **Pour hold of 5 frames, 5-unit mugs, bartender run speed, catch radius.**
  Soda Jerk's input is touch, and it has two drink colours and a different
  bartender. These were measured and are listed here to reuse, not forced in.
- **Walk-speed bump, mug-speed bump, the wave pattern, difficulty rows.**
  Soda Jerk has its own level curve (`levels.js`) in place of them.
- **Level crowd counts.** `levels.js` already has its own.

## How to re-check

The harness that produced this isn't kept in the repo. It's a few hundred
lines of Python around the `z80` package: the Z80 plus a model of the CTC
interrupt controller (its timers drive the game) and the input ports. With
that, every number above can be re-measured by writing RAM, pressing the
buttons, and tracing the patron objects frame by frame.
