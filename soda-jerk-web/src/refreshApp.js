// Saved-to-homescreen apps have no browser reload button and can
// otherwise get stuck showing whatever was cached the day they were
// added — a plain reload can still hit that same cached copy, so this
// forces a real network fetch with a cache-busting URL.
export function refreshApp() {
  const url = new URL(window.location.href)
  url.searchParams.set('_r', Date.now().toString())
  window.location.href = url.toString()
}
