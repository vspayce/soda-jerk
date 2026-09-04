/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // 1920s-30s speakeasy / art deco palette
        ink: '#151014',      // near-black, warm rather than pure black
        brass: '#C6A15B',    // brass fixtures / trim
        brassDark: '#8A6E37',
        emerald: '#0E4B43',  // deep speakeasy green
        emeraldLight: '#1B6F62',
        cream: '#EDE3D0',    // menu card / marble tone
        garnet: '#7A1F2B',   // accent red (banquettes, awnings)
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        body: ['"Inter"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
