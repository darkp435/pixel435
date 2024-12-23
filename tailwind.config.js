/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./**/*{html,js}", "!./node_modules/**"],
  theme: {
    extend: {
      fontFamily: {
        nunito: ['Nunito', 'sans-serif']
      },
    },
  },
  plugins: [],
}

