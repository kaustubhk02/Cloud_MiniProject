/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        display: ['Syne', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        brand: {
          50:  '#f0f4ff',
          100: '#dde6ff',
          200: '#c3d1ff',
          300: '#9db2ff',
          400: '#7087ff',
          500: '#4f5eff',
          600: '#3a3ef5',
          700: '#2e2fd8',
          800: '#2828ae',
          900: '#272889',
        },
        surface: {
          50:  '#f8f9fc',
          100: '#f0f2f8',
          200: '#e2e6f0',
          300: '#c8cfde',
          400: '#a8b2c8',
          500: '#8894ae',
          600: '#6b7894',
          700: '#556278',
          800: '#3e4a5c',
          900: '#1e2536',
          950: '#111827',
        },
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,.06), 0 4px 16px rgba(0,0,0,.06)',
        elevated: '0 4px 24px rgba(0,0,0,.10)',
        glow: '0 0 24px rgba(79,94,255,.3)',
      },
    },
  },
  plugins: [],
};
