// Where art lives, and how a patron's files are named.
//
// BASE_URL respects vite.config.js's `base`, so these still resolve once
// deployed under /soda-jerk/ on GitHub Pages.
export const ART_SRC = (name) => `${import.meta.env.BASE_URL}art/${name}`

// The patron files are numbered from 1 but the first one has no number at
// all — patron.png, patron2.png, patron3.png... — and the drink type picks
// the colour. That rule was written out separately in three components,
// once as a hardcoded table and twice as string-building, which is exactly
// the sort of thing that drifts the moment a patron is added.
const patronBase = (patronType) => (patronType === 0 ? 'patron' : `patron${patronType + 1}`)
const drinkSuffix = (drinkType) => (drinkType === 0 ? 'orange' : 'pink')

export const patronPortrait = (patronType, drinkType) =>
  ART_SRC(`${patronBase(patronType)}-${drinkSuffix(drinkType)}.png`)

export const patronWalkSheet = (patronType, drinkType) =>
  ART_SRC(`${patronBase(patronType)}-${drinkSuffix(drinkType)}-walk.png`)

// The moment-of-catch pose, holding the drink they ordered.
export const patronHeld = (patronType, drinkType) =>
  ART_SRC(`${patronBase(patronType)}-${drinkSuffix(drinkType)}-held.png`)

// The patron leaning in to spray the jerk after reaching the end of the bar.
export const patronSpray = (patronType, drinkType) =>
  ART_SRC(
    patronType === 0
      ? `spray-${drinkSuffix(drinkType)}.png`
      : `spray-patron${patronType + 1}-${drinkSuffix(drinkType)}.png`
  )
