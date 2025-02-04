/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "dark-brown": "#3b1e00",
        "light-brown": "#844302"
      }
    },
  },
  plugins: [],
}

