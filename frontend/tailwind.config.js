/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'forensics-red': '#E74C3C',
        'forensics-red-dark': '#C0392B',
        'forensics-green': '#27AE60',
        'forensics-blue': '#5DADE2',
        'forensics-blue-dark': '#34495E',
        'neutral-950': '#0D0D0D', // Primary bg
        'neutral-900': '#161616', // Secondary bg
        'neutral-850': '#1E1E1E', // Tertiary bg
        'neutral-800': '#2A2A2A', // Border light
        'neutral-700': '#333333', // Border medium
        'neutral-600': '#4A4A4A', // Border strong
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
        mono: ['IBM Plex Mono', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
}
