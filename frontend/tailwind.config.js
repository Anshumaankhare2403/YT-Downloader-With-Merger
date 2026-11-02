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
        canvas: {
          light: '#F6F4F0',
          dark: '#09090B',
          cardLight: '#FFFFFF',
          cardDark: '#121215',
          borderLight: '#E4DFD5',
          borderDark: '#222226',
        },
        ink: {
          950: '#09090B',
          900: '#121215',
          850: '#18181D',
          800: '#222226',
          700: '#34343A',
          600: '#52525B',
          500: '#71717A',
          400: '#A1A1AA',
          300: '#D4D4D8',
          200: '#E4E4E7',
          100: '#F4F4F6',
          50: '#FAFAFA',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
