/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html','./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Syne"', 'sans-serif'],
        body:    ['"DM Sans"', 'sans-serif'],
        mono:    ['"DM Mono"', 'monospace'],
      },
      colors: {
        ink:    '#0D1117',
        panel:  '#161B22',
        border: '#21262D',
        muted:  '#8B949E',
        accent: '#F0B429',
        emerald:'#3FB950',
        danger: '#F85149',
        sky:    '#58A6FF',
        violet: '#BC8CFF',
      },
    },
  },
  plugins: [],
}
