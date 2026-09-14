import { useEffect } from 'react'

// Publishes the genuinely visible height as --app-h, so the game fits the
// space the browser is actually giving it.
//
// This exists for iOS Safari. There, 100vh is the LARGE viewport — the
// height the page would have if the toolbars were hidden — so a full-height
// layout runs underneath the address bar and the bottom tab bar. The drink
// taps sit at the bottom of the frame, which is precisely where the tab bar
// lands, so they end up unreachable. Nothing about safe-area insets helps:
// those describe the notch and home indicator, not browser chrome.
//
// visualViewport reports what's really on screen, and fires as the toolbars
// slide in and out (they collapse on scroll and come back on tap), so the
// frame keeps up instead of only being right at load. Installed on an iPhone
// as a home-screen app there's no chrome at all and this simply matches the
// window — it costs nothing to leave on.
export function useViewportHeight() {
  useEffect(() => {
    const vv = window.visualViewport

    const apply = () => {
      // visualViewport shrinks when the on-screen keyboard opens too, which
      // would squash the game. The game never takes text input, but the
      // leaderboard's name field does, so prefer the larger of the two when
      // they disagree by a lot.
      const visible = vv ? vv.height : window.innerHeight
      const height = Math.round(Math.max(visible, window.innerHeight * 0.6))
      document.documentElement.style.setProperty('--app-h', `${height}px`)
    }

    apply()

    vv?.addEventListener('resize', apply)
    vv?.addEventListener('scroll', apply)
    window.addEventListener('resize', apply)
    window.addEventListener('orientationchange', apply)

    return () => {
      vv?.removeEventListener('resize', apply)
      vv?.removeEventListener('scroll', apply)
      window.removeEventListener('resize', apply)
      window.removeEventListener('orientationchange', apply)
    }
  }, [])
}
