/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#f5efe4',
        'bg-warm': '#ede4d2',
        paper: '#faf6ec',
        ink: '#1c1612',
        'ink-soft': '#3d342b',
        'ink-muted': '#6b5d4f',
        line: '#d9cdb6',
        'line-soft': '#e6dcc8',
        amber: {
          DEFAULT: '#c8651b',
          deep: '#9c4a0e',
          soft: '#f0d9b5',
        },
        moss: '#5c6b3a',
        wood: {
          dark: '#2a1f17',
          mid: '#6b4a2b',
        },
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Manrope', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(28,22,18,.06), 0 4px 16px rgba(28,22,18,.06)',
        lift: '0 2px 4px rgba(28,22,18,.08), 0 12px 32px rgba(28,22,18,.10)',
      },
      animation: {
        'page-in': 'pageIn 0.4s ease',
      },
      keyframes: {
        pageIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
