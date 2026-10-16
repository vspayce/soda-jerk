// Measurements of each patron's art, shared by the web game (Customer.jsx)
// and the iOS/tvOS apps (bundled with the engine).
//
// Every patron's art is built by tools/patron_rig from ONE source portrait,
// and every figure is drawn 267px tall on a 279px-tall canvas, so one
// height puts the whole roster at the same scale. Per patronType:
//
//   width  — the canvas width (px), for the aspect ratio
//   ground — how far one walk cycle carries the figure, as a fraction of
//            its height: the backward travel of whichever foot is planted,
//            added up over the cycle. tools/patron_rig/build.py measures it
//            and prints it. It's what times the legs.
//
// To add a patron: add them to tools/patron_rig/characters.py, run its
// build.py, add a row here with the canvas width and ground it prints, and
// add a weight to PATRON_TYPE_WEIGHTS in constants.js.
export const PATRON_CANVAS_HEIGHT = 279

export const PATRON_ART = [
  { width: 191, ground: 0.436 },
  { width: 294, ground: 0.237 },
  { width: 201, ground: 0.427 },
  { width: 202, ground: 0.251 },
  { width: 196, ground: 0.471 },
  { width: 171, ground: 0.496 },
  { width: 187, ground: 0.456 },
  { width: 200, ground: 0.357 },
  { width: 227, ground: 0.192 },
  { width: 206, ground: 0.537 },
  { width: 192, ground: 0.211 },
  { width: 158, ground: 0.32 },
]

// Art file names, without a folder: patron.png, patron2.png, patron3.png...
// and the drink type picks the colour.
export const patronBase = (patronType) => (patronType === 0 ? 'patron' : `patron${patronType + 1}`)
export const drinkSuffix = (drinkType) => (drinkType === 0 ? 'orange' : 'pink')
