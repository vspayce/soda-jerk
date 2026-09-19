import { useEffect, useRef } from 'react'

// Runs `fn` whenever a counter coming out of the sim goes UP.
//
// The sim signals one-off events by bumping a counter rather than by
// firing callbacks, since it's a mutable ref stepped on every frame and
// has no idea when React will look at it. Reacting to that means keeping
// the previous value and comparing — which was written out longhand eight
// times over in App.jsx, one `useRef` and one `useEffect` apiece, all
// identical but for which sound came out at the end.
//
// Firing on an increase rather than on any change is what makes a reset
// safe. Restarting hands back a brand-new sim with every counter back at
// 0, and a bonus round's counters drop to 0 when its state object goes
// away; on a plain not-equal test each of those reads as a change and
// replays whichever effect fired last — a phantom spray or shatter the
// instant you restart. Callers used to reach in and zero the refs by hand
// to avoid exactly that, which is its own trap: the refs are private to
// this hook, so that code silently rotted into a ReferenceError the moment
// the longhand was replaced, and the Tap to Reopen button stopped working.
//
// The callback is held in a ref so it can close over fresh state without
// re-arming the comparison; only the counter belongs in the dependencies.
export function useOnCounter(count, fn) {
  const prevRef = useRef(count)
  const fnRef = useRef(fn)
  fnRef.current = fn

  useEffect(() => {
    const prev = prevRef.current
    prevRef.current = count
    if (count <= prev) return // a reset, or no change at all
    return fnRef.current()
  }, [count])
}
