/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        white: 'var(--color-white)',
        black: 'var(--color-black)',
        brand: {
          50: 'var(--color-brand-50)',
          100: 'var(--color-brand-100)',
          200: 'var(--color-brand-200)',
          300: 'var(--color-brand-300)',
          400: 'var(--color-brand-400)',
          500: 'var(--color-brand-500)',
          600: 'var(--color-brand-600)',
          700: 'var(--color-brand-700)',
          800: 'var(--color-brand-800)',
          900: 'var(--color-brand-900)',
        },
        ink: {
          50: 'var(--color-ink-50)',
          100: 'var(--color-ink-100)',
          200: 'var(--color-ink-200)',
          300: 'var(--color-ink-300)',
          400: 'var(--color-ink-400)',
          500: 'var(--color-ink-500)',
          600: 'var(--color-ink-600)',
          700: 'var(--color-ink-700)',
          800: 'var(--color-ink-800)',
          900: 'var(--color-ink-900)',
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
