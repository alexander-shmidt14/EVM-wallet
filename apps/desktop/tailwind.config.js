/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/frontend/**/*.{js,ts,jsx,tsx}",
    "./src/frontend/index.html",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef2f2',
          100: '#fde3e3',
          200: '#f9baba',
          300: '#f28585',
          400: '#e54550',
          500: '#d4213b',
          600: '#BE0E20',
          700: '#9B0B1A',
          800: '#7f0915',
          900: '#6b0a14',
        },
        dark: {
          900: '#09111C',
          800: '#0D1829',
          700: '#111D2E',
          600: '#1E2D3D',
          500: '#2A3A4D',
          400: '#3D5066',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
