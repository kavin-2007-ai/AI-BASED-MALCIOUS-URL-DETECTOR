/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#070b14',
          900: '#0b1329',
          800: '#111e3f',
          700: '#1b2c5b',
        },
        charcoal: {
          900: '#0f172a',
          800: '#1e293b',
          700: '#334155',
        },
        sentinel: {
          cyan: '#00f2fe',
          blue: '#3b82f6',
          safe: '#10b981',
          suspicious: '#f59e0b',
          malicious: '#ef4444',
        }
      }
    },
  },
  plugins: [],
}
