/** @type {import('tailwindcss').Config} */

// Theme colours live in index.css as "R G B" channels so opacity modifiers
// (bg-white/90, bg-ink-900/40, ...) work and the palette flips in dark mode.
const themeColor = (name) => `rgb(var(--color-${name}) / <alpha-value>)`;
const scale = (name) =>
  Object.fromEntries([50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((step) => [step, themeColor(`${name}-${step}`)]));

// slate/gray are used directly by many pages; route them through the ink
// scale so those pages follow light/dark mode too.
const inkAlias = { ...scale('ink'), 950: themeColor('ink-900') };

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        white: themeColor('white'),
        black: themeColor('black'),
        brand: scale('brand'),
        ink: scale('ink'),
        slate: inkAlias,
        gray: inkAlias,
        // Fixed dark surfaces (sidebar, modal backdrops) that stay dark in both themes
        night: {
          300: '#cbd5e1',
          400: '#94a3b8',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
      },
      fontFamily: {
        display: ['"Source Serif 4"', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'page-glow':
          'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(47, 122, 105, 0.18), transparent), radial-gradient(ellipse 60% 40% at 100% 0%, rgba(31, 38, 46, 0.06), transparent)',
      },
    },
  },
  plugins: [],
};
