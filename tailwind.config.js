/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#F6F3EC',
        surface: '#FBFAF6',
        border: '#DDD8CB',
        primary: {
          dark: '#14213D',
          DEFAULT: '#12706F',
          light: '#2A9D8F',
        },
        ink: {
          DEFAULT: '#14213D',
          secondary: '#4A5568',
          muted: '#718096',
        },
        accent: {
          teal: '#12706F',
        },
        warning: {
          text: '#9A5A00',
          fill: '#F2B84B',
          tint: '#FBEBC8',
        },
        danger: {
          DEFAULT: '#A8323F',
          tint: '#F9DADD',
        },
        status: {
          met: '#12706F',
          unknown: '#D97706',
          unmet: '#A8323F',
        }
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
