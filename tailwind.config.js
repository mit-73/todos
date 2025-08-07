/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Light theme
        'light-bg': '#e0e5ec',
        'light-surface': '#e0e5ec',
        'light-text': '#5a6470',
        'light-text-muted': '#9ba6b3',
        'light-primary': '#4a7bfc',
        'light-primary-text': '#ffffff',
        'light-danger': '#d9534f',

        // Dark theme
        'dark-bg': '#2c3036',
        'dark-surface': '#2c3036',
        'dark-text': '#d1d5db',
        'dark-text-muted': '#8e949a',
        'dark-primary': '#4a7bfc',
        'dark-primary-text': '#ffffff',
        'dark-danger': '#e57373',
      },
      boxShadow: {
        // Light theme shadows
        'neumorphic-outset': '5px 5px 10px #a3b1c6, -5px -5px 10px #ffffff',
        'neumorphic-inset': 'inset 5px 5px 10px #a3b1c6, inset -5px -5px 10px #ffffff',
        'neumorphic-outset-sm': '2px 2px 5px #a3b1c6, -2px -2px 5px #ffffff',
        'neumorphic-inset-sm': 'inset 2px 2px 5px #a3b1c6, inset -2px -2px 5px #ffffff',
        // Dark theme shadows
        'neumorphic-outset-dark': '5px 5px 10px #21252a, -5px -5px 10px #373c43',
        'neumorphic-inset-dark': 'inset 5px 5px 10px #21252a, inset -5px -5px 10px #373c43',
        'neumorphic-outset-sm-dark': '2px 2px 5px #21252a, -2px -2px 5px #373c43',
        'neumorphic-inset-sm-dark': 'inset 2px 2px 5px #21252a, inset -2px -2px 5px #373c43',
      },
    },
  },
  plugins: [],
}
