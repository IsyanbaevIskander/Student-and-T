/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'tbank-yellow': '#FDD100',
        'tbank-black': '#1A1A1A',
        'tbank-gray': '#F5F5F5',
      },
      fontFamily: {
        // 'tinkoff': ['TinkoffSans', 'sans-serif'],
        'tinkoff': ['sans-serif'],
        // 'tinkoff': ['TinkoffSans'],
      },
    },
  },
  plugins: [],
}