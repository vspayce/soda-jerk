import { useEffect, useRef } from 'react'

// Runs `fn` whenever a counter coming out of the sim changes.
//
// The sim signals one-off events by bumping a counter rather than by
// firing callbacks, since it's a mutable ref stepped on every frame and
// has no idea when React will look at it. Reacting to that means keeping
// the previous value and comparing — which was written out longhand eight
// times over in App.jsx, one `useRef` and one `useEffect` apiece, all
// identical but for which sound came out at the end.
//
// The callback is held in a ref so it can close over fresh state without
// re-arming the comparison; only the counter belongs in the dependencies.
export function useOnCounter(count, fn) {
  const prevRef = useRef(count)
  const fnRef = useRef(fn)
  fnRef.current = fn

  useEffect(() => {
    if (count === prevRef.current) return
    prevRef.current = count
    return fnRef.current()
  }, [count])
}
