/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'comdirect': {
          'yellow': '#FFD500',
          'blue': '#003C71',
          'dark': '#001E3C',
        }
      }
    },
  },
  plugins: [],
}

