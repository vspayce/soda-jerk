// Entry point for the iOS/tvOS apps' copy of the engine: everything they
// need from the shared game code, bundled into one script by
// scripts/build-engine.mjs and run in JavaScriptCore. The apps draw the
// game natively; the rules all come from here, the same as the web game.
export * from './engine.js'
export * as C from './constants.js'
export { LEVELS, getLevel } from './levels.js'
export { VENUES } from './venues.js'
export { PATRON_ART, PATRON_CANVAS_HEIGHT, patronBase, drinkSuffix } from './patronArt.js'

// The whole sim as JSON, for the app to draw each frame. Drops nothing —
// the sim is plain data.
export function snapshot(sim) {
  return JSON.stringify(sim)
}
