/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef6f4',
          100: '#d5eae4',
          200: '#abd4c9',
          300: '#79b8a8',
          400: '#4f9987',
          500: '#2f7a69',
          600: '#246155',
          700: '#1e4d44',
          800: '#1a3f39',
          900: '#163530',
        },
        ink: {
          50: '#f6f7f8',
          100: '#eceef0',
          200: '#d5dae0',
          300: '#b0b9c4',
          400: '#8593a3',
          500: '#667788',
          600: '#516070',
          700: '#434e5b',
          800: '#3a434d',
          900: '#1f262e',
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
