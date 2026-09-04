import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// IMPORTANT: set `base` to match your GitHub repo name for Pages to
// serve assets correctly, e.g. '/soda-jerk/' if your repo is
// github.com/you/soda-jerk. Use '/' if deploying to a user/org page
// (username.github.io) instead of a project page.
//
// This only applies during `npm run build` (used for GitHub Pages).
// In dev (`npm run dev`) it stays '/' so the app loads at the plain
// localhost root instead of localhost:5173/soda-jerk/.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/soda-jerk/' : '/',
  plugins: [react()],
}))