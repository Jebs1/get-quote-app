/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        display: ['Instrument Serif', 'serif'],
      },
      colors: {
        navy: { 50: '#DBEAFE', 100: '#BFDBFE', 200: '#93C5FD', 300: '#60A5FA', 400: '#3B82F6', 500: '#2563EB', 600: '#1D4ED8', 700: '#1E3A8A', 800: '#1E2D6D', 900: '#0F1E50' },
        gold: { 50: '#FFF8E1', 100: '#FFECB3', 200: '#F5D77A', 300: '#D4A843', 400: '#B8860B', 500: '#996515' },
        surface: { 0: 'var(--surface-0)', 1: 'var(--surface-1)', 2: 'var(--surface-2)', 3: 'var(--surface-3)' },
        accent: { DEFAULT: 'var(--accent)', hover: 'var(--accent-hover)', light: 'var(--accent-light)', gold: 'var(--accent-gold)' },
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
        border: 'var(--border)',
      },
    },
  },
  plugins: [],
}
