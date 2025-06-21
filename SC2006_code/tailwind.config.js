/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'health-primary': '#2C5282', // Deep blue for trust and professionalism
        'health-secondary': '#48BB78', // Green for health and vitality
        'health-accent': '#F6AD55', // Orange for warmth and accessibility
        'health-light': '#EDF2F7', // Light background
        'health-dark': '#2D3748', // Dark text
      }
    },
  },
  plugins: [],
}