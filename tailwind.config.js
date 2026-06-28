/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: '#FDFBF7',
        brandBlue: '#0F4C81', // Azul Crunchy Club
        brandBlueLight: '#2A6B9E'
      }
    },
  },
  plugins: [],
}

