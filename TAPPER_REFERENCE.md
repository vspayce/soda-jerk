# Tapper reference — mechanics notes for Soda Jerk

Source: "Tapper [Arcade Longplay] (1984) Bally Midway {Root Beer}",
https://www.youtube.com/watch?v=ZwhWszgkPow (18:53, one full credit, final
score 138,575, no narration). Watched 2026-10-07 by sampling one frame about
every 11 seconds, so fast events (a single mug toss, the exact moment a life is
lost) fall between samples. Timestamps are `MM:SS` into that video.

**Confidence key:** **Seen** = visible in a sampled frame. **Inferred** =
follows from frames before and after. **Not seen** = well-known Tapper behavior
I couldn't confirm from these frames; verify it before relying on it.

---

## 1. Core loop (Seen)

The game's own attract-mode tutorial (16:48–18:41) states the three controls:

1. **"PULL TAPPER TO FILL MUG"** (16:48, 17:45): the bartender stands at the
   tap and holds the handle while the mug fills. Filling takes time; it isn't
   instant.
2. **"RELEASE TAPPER TO FLING MUG"** (00:11): letting go slides the full mug
   down the bar toward the customers.
3. **"TAP JOYSTICK TO CHANGE BARS"** (18:41): up/down **jumps** straight to
   the tap of another bar. Left/right **walks** along the current bar, which
   you need to catch empties and grab tips (seen at 01:53, 02:50, 03:35).

Each level has 4 bars. Customers come in at the far end of every bar and
shuffle toward the bartender. A full mug that reaches a customer pushes them
back toward the door; one pushed all the way out is cleared. A customer who
was served drinks for a moment, then slides the **empty back** toward the
bartender, who has to catch it. The level ends when all four bars are empty
(between 01:42 and 01:53 the level counter goes from 2 to 3 right after a
"GET READY TO SERVE" card, which also appears at 03:24 and 05:40).

**Soda Jerk status:** already matches this loop: `LANE_COUNT = 4`, customers
pushed back by `CUSTOMER_PUSH_DISTANCE`, a drinking pause (`drinkMs`) followed
by a returning glass (`glassMs`), and a level is passed once a bar is cleared.
**Difference:** Tapper's pour is **hold to fill, release to throw**, while
Soda Jerk pours in a single tap (`pourDrink()`). The fill time is Tapper's main
pressure valve: you can't spam mugs, so you have to pick which bar to serve.
→ *Biggest single "feel" change available.*

## 2. Ways to lose a life (well-known Tapper rules; frames back up 3 and 4)

1. A customer reaches the bartender's end of the bar. In Tapper they grab the
   bartender and **slide him down the bar**.
2. A full mug slides off the far end with nobody there to catch it, and
   **shatters**.
3. An empty mug coming back reaches the bartender's end uncaught and
   **shatters** (frames show empties travelling back at 05:51 and 06:36).
4. Lives are shown as **little mug icons under the score**. The run starts
   with 2 icons at 01:42 and has 4 icons by 05:06, so extra lives are earned.

**Soda Jerk status:** all three loss types exist ("YOU MISSED",
`missedGlassCount`, the spray), and so do `EXTRA_LIFE_EVERY = 10000` and
`STARTING_LIVES = 3`. ✅ Little to change.

## 3. Venues and progression (Seen)

The level number sits in the bottom-right corner. Tapper changes the venue
**after every bonus round**, and each venue gets a little harder:

| Venue | Levels (Seen) | Video time | Layout |
|---|---|---|---|
| Western saloon | 1–2 | 00:34–01:42 | Taps on the **right** wall, customers come in from the left |
| Sports stadium | 3–5 | 01:53–04:55 | **Flipped**: taps on the left, fans come in from the bleachers on the right. Hot-air blimp overhead |
| Punk bar | 6–9 | 05:06–10:34 | **Mixed**: some bars have their tap on the left, some on the right. The bartender is seen at the left end of bar 2 (05:06) and the right end of bar 1 (05:51) |
| Space bar | 10–13 | 10:46–14:55 | Alien customers. Bars are offset from each other and the bartender rides a red hover disc. Taps change sides between bars (11:20 bottom-left, 12:39 bottom-right) |
| Saloon again | 14+ | 15:06 | Loops back to the first venue, now faster and more crowded |

- Each new venue gets **one more level** than the last (2 → 3 → 4 → 4).
- Crowds grow within a venue: about 2 per bar at 00:34, 3–4 per bar at 06:36,
  and up to 5 or more per bar in space (11:42).

**Soda Jerk status:** per-bar flipping already exists (`reversed` in
`levels.js`), which matches the punk and space bars. **Differences:**
- Soda Jerk flips a different mix of bars every level. Tapper keeps one layout
  for a whole venue, so each venue feels like a place to learn.
- `STAGE_COUNT = 3` and `BONUS_EVERY_LEVELS = 3` are fixed, while Tapper's
  venues get longer each time.
- Tapper loops back to the first venue at a higher speed instead of capping.

→ *Possible change: put the flip pattern on the venue instead of the level,
and make each venue one level longer than the last.*

## 4. Tips and the distraction show (Seen, with one rule inferred)

- **Tips:** a small green item (money) sits on the bar near the door end at
  02:50 while the bartender runs down the bar toward it. In Tapper, a customer
  sometimes **leaves a tip after being served**, at the spot where they were
  standing. Tips don't appear at random.
- **The show:** at 03:13 **three cheerleaders dance on the top bar** right
  after that tip was collected. In Tapper, picking up a tip starts the
  entertainers. While they dance, some customers turn to watch, stop walking,
  and **ignore drinks**, which slide past them. The bartender gets breathing
  room but can also lose mugs to the far end.
- Each venue has its own show (cheerleaders in the stadium). I didn't sample
  the show in the other venues.

**Soda Jerk status:** the show already exists (hot dog → dachshund dance,
`SHOW_WATCH_CHANCE`, watchers let drinks slide past). ✅ **Difference:**
Soda Jerk drops the hot dog on a **random timer** (`BONUS_SPAWN_INTERVAL_*`).
In Tapper the tip comes **from a served customer**, so the reward is tied to
serving well and appears exactly where the action is.
→ *Possible change: when a customer is served, give a small chance of leaving
the hot dog or tip at their x position.*

## 5. Bonus round (Seen; for reference only)

Between venues Tapper runs a shell game: a masked bandit shakes 5 of 6 cans,
shuffles them, and you open the unshaken one for 3000 pts ("THIS ONES FOR YOU",
10:34). **Not wanted for Soda Jerk** (decided 2026-10-07). Soda Jerk keeps its
own bonus rounds (wheel, plate wash, shaker toss).

## 6. Scoring (Seen: the game's own card at 00:40, "CLEAR ALL CUSTOMERS TO ADVANCE")

| Event | Points |
|---|---|
| Empty mug caught | 100 |
| Customer pushed out the door | 50 / 75 / 100 / 150, depending on customer type |
| Tip collected | 1500 |
| Bonus round, correct can | 3000 (10:34) |

Score checkpoints in the video: 4,600 after levels 1–2 → 30,125 at the second
bonus → 82,525 at the third → 129,875 at the fourth → **138,575 game over**
(about 16:14, then "ENTER YOUR INITIALS"). Level 14 is the furthest reached.

**Soda Jerk now:** `OUST_POINTS_BY_STAGE = [50, 100, 150]` (by venue rather
than by customer type), `POINTS_PER_CAUGHT_GLASS = 100` (same as Tapper),
`POINTS_PER_BONUS = 500` for the hot dog (Tapper's tip is 1500).

## 7. Presentation details worth copying (Seen)

- A **"GET READY TO SERVE"** card with the bartender between levels (03:24,
  05:40).
- An attract mode that **teaches the controls**, one at a time, on a
  2-bar mini scene (16:48–18:41). It works as a tutorial without any text
  screens.
- A high-score initials screen after game over (16:14) and a high-score table
  (17:34). Soda Jerk already has `LeaderboardScreen`.

---

## 8. Pacing and tension: why Soda Jerk doesn't feel like Tapper

**Measured from level 1 (00:45–00:53, one frame every 0.5s):**
- Level 1 opens with just **one customer per bar**, standing at the door end.
  They advance slowly; one of them covers about 15% of the bar in 4s.
- A full mug crosses the whole bar in **about 1s**.
- Score: 50 → 100 → 150 in the first 5s, one customer pushed out at a time.

So Tapper's early speeds are **close to Soda Jerk's**: `MUG_TRAVEL_MS = 800`,
and a level 1 patron needs about 20s to walk the bar (`travelMs` 11s plus 13
step pauses of 650ms). Raw speed isn't the gap. The rules around throwing are.
Tapper's tension comes from **throughput and risk**: every action costs time,
every mug does something, and greed (sending too many mugs, walking away from
the taps) gets punished. Soda Jerk's engine removes most of those costs:

| Tapper | Soda Jerk now (in `useGameEngine.js`) | Effect on tension |
|---|---|---|
| You can send mugs down a bar back to back, and a crowded bar needs rapid fire | **One mug per lane in flight** (`pourDrink`: `if (sim.mugs.some((m) => m.lane === lane)) return`) | You're never behind; a crowded bar gets drip-fed |
| Over-throwing is the classic mistake: mug #3 flies off the end once the bar's empty | Throws are **blocked** when every patron in the lane is busy (`if (busy && !thirsty) return`) | The main risky decision ("one more, or switch?") is gone |
| Filling a mug takes time while customers keep walking | **Instant pour** | Serving costs nothing, so there's no triage between bars |
| Walking down the bar for a tip or an empty leaves you away from the taps, and you have to walk back | Throwing or grabbing the hot dog **teleports the jerk home** (`sim.playerX = C.PLAYER_X` in `pourDrink` and in the hot dog grab) | Being greedy carries no risk |
| A mug hits **the first customer it reaches** | A mug only hits a **walking patron who ordered that drink**, and passes through everyone else | The challenge becomes reading orders, not juggling bars. This is Soda Jerk's own idea, so it's a tradeoff, not a bug |

What isn't the cause: walking in steps (Tapper's customers hop too), mug
speed, empties sliding back, and life loss restarting the level (Tapper resets
the bars too).

## Suggested priorities

0. ✅ **Tension first (done 2026-10-07, see section 8):** several mugs can be
   on a bar at once (`POUR_COOLDOWN_MS` between throws), throws at a busy bar
   aren't blocked any more (over-throwing breaks a mug), the jerk runs back to
   the tap to pour instead of teleporting, and grabbing the hot dog leaves him
   where he is. Mugs now hit the nearest matching patron.
1. **Hold-to-fill, release-to-throw pour.** Biggest change to how it feels;
   the fill time should get a little shorter at higher levels.
2. **Tips come from served customers** instead of a random timer.
3. **One flip layout per venue, and each venue one level longer than the
   last.** Venues become places you learn.
4. Loop back to the first venue at a faster pace instead of capping at the
   last row of `LEVELS`.
