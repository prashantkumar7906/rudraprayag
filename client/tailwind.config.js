/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bhagwa: '#FF6600',
        vermillion: '#CC3300',
        ambergold: '#E8A020',
        complementblue: '#0055AA',
        saffrontinit: '#FFF0E0',
        indigotint: '#E8F0FF',
        darktext: '#2C1200',
        muted: '#F9A86A',
        hdrbg: '#FFCCAA',
      },
      fontFamily: {
        serif: ['Noto Serif', 'Georgia', 'serif'],
        sans: ['Inter', 'Noto Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
