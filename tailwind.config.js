/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // stonowana paleta, bez jaskrawych kolorów
        slate: {
          925: '#0f151c'
        },
        brand: {
          50: '#f4f7f8',
          100: '#e7edf0',
          200: '#cdd9de',
          300: '#a9bcc4',
          400: '#7d97a3',
          500: '#5c7a88',
          600: '#496372',
          700: '#3d515d',
          800: '#35444e',
          900: '#2f3b43',
          950: '#1b2226'
        },
        alert: {
          50: '#fdf3f2',
          100: '#fbe4e2',
          400: '#d9695f',
          500: '#c14a3f',
          600: '#a83a30',
          700: '#8a2f27'
        },
        ok: {
          50: '#f2f7f3',
          400: '#5d9270',
          500: '#457a5a',
          600: '#386249'
        },
        warn: {
          50: '#fbf6ec',
          400: '#c99a3f',
          500: '#af8330',
          600: '#8f6a26'
        }
      },
      fontFamily: {
        sans: ['"Source Sans 3"', '"Segoe UI"', 'Arial', 'sans-serif'],
        serif: ['"Source Serif 4"', 'Georgia', 'serif']
      },
      boxShadow: {
        card: '0 1px 2px rgba(27,34,38,0.06), 0 1px 1px rgba(27,34,38,0.04)',
        panel: '0 2px 8px rgba(27,34,38,0.08)'
      }
    }
  },
  plugins: []
}
