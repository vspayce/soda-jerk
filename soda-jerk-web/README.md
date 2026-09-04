# Soda Jerk (web prototype)

Classic Tapper-style level, prototyped in React + Vite + Tailwind.
1920s-30s speakeasy theme, touch-first controls, portrait layout,
endless survival mode. See `BACKLOG.md` for the other planned level
types (upside-down bar, sliding level, carousel, trick mini-games).

## Setup

```bash
npm install
npm run dev
```

Opens a local dev server (usually `http://localhost:5173`) with hot
reload. Playtest in your browser's device toolbar set to a phone size,
or just resize the window — the game locks itself to a portrait
"phone frame" either way.

## Controls

- **Swipe up/down** anywhere on screen — move between the 4 bars.
  Swiping past the top bar wraps you to the bottom one, and vice
  versa.
- **Tap** — serve a soda down your current bar to a waiting customer.
  If a customer has sent their empty glass back on your current lane,
  tapping catches it instead.

## Where things live

- `src/game/constants.js` — every tunable number (speeds, spawn
  rate, patience, difficulty ramp, points). Start here to rebalance.
- `src/game/useGameEngine.js` — the simulation: spawning, movement,
  serving, glass-return, difficulty ramp, lives/game-over. Framework-
  agnostic game logic, kept separate from rendering.
- `src/components/` — rendering only (Lane, Customer, Player, HUD,
  GameOverScreen). All positions come from the engine as percentages.
- `src/App.jsx` — layout + touch input (swipe vs. tap detection).

## Deploying to GitHub Pages

1. Push this repo to GitHub under the name **soda-jerk** (or update
   `base` in `vite.config.js` to match whatever you name it).
2. `npm run deploy` — builds and publishes to a `gh-pages` branch
   (the `gh-pages` package is already in `devDependencies`).
3. In the repo's Settings → Pages, set the source to the `gh-pages`
   branch.

## Known simplifications (intentional, for this prototype)

- One customer walk-in per lane at a time, and one mug in flight per
  lane at a time — keeps the loop readable while the core feel gets
  dialed in. Loosening both is a natural next step once serving feels
  good.
- Difficulty ramps continuously with survival time rather than in
  discrete waves, matching the "endless mode" decision — no fixed
  end state, no persistent high score yet.
- Placeholder art is CSS shapes + emoji, not real sprites. Swap
  `Customer.jsx` / `Player.jsx` for image-based sprites once you've
  got AI-generated or commissioned art to drop in.
