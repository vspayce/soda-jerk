// The venues — where the bar is. Like Tapper, the venue changes after each
// bonus round: BONUS_EVERY_LEVELS levels in one, then the next, looping
// back to the first once they've all been played (at the faster pace the
// levels have reached by then).
//
// Each venue's look lives with what draws it: the walls, floor and signs
// in PerspectiveBackdrop.jsx, the counter, doors and stools in Lane.jsx
// (art from tools/venue_art). This list is just the order and the names.
import { BONUS_EVERY_LEVELS } from './constants.js'

export const VENUES = [
  { id: 'speakeasy', name: 'The Speakeasy', tagline: 'Keep it on the hush' },
  { id: 'fountain', name: "Pop's Soda Fountain", tagline: 'Sodas · Sundaes · Malts' },
  { id: 'circus', name: 'The Big Top', tagline: 'Step right up!' },
]

// Level numbers start at 1.
export function venueIndexForLevel(level) {
  return Math.floor((Math.max(1, level) - 1) / BONUS_EVERY_LEVELS) % VENUES.length
}

// The first level played in the venue after the one `level` is in.
export function firstLevelOfNextVenue(level) {
  return (Math.floor((Math.max(1, level) - 1) / BONUS_EVERY_LEVELS) + 1) * BONUS_EVERY_LEVELS + 1
}
