/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#edf5ec',
          100: '#dcebd7',
          200: '#c0d7b8',
          300: '#9abc91',
          400: '#73a271',
          500: '#4e8052',
          600: '#346640',
          700: '#285235',
          800: '#21422d',
          900: '#1b3626',
          950: '#12271c',
        },
        canvas: '#f6f7f2',
        ink: '#192b21',
        line: '#dce3d9',
        limewash: '#dfecbd',
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['DM Serif Display', 'Georgia', 'serif'],
      },
      borderRadius: {
        panel: '1.25rem',
      },
      boxShadow: {
        panel: '0 2px 5px rgb(25 43 33 / .04), 0 16px 36px -28px rgb(25 43 33 / .26)',
        overlay: '0 20px 70px rgb(18 39 28 / .26)',
      },
    },
  },
  plugins: [],
}
