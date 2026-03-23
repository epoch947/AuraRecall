import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        oatmeal:  '#F5F0E8',
        sage:     '#B9B99D',
        linen:    '#E6E4E0',
        charcoal: '#333333',
      },
      fontFamily: {
        serif: ['Georgia', 'Cambria', '"Times New Roman"', 'Times', 'serif'],
        mono:  ['"Courier New"', 'Courier', 'monospace'],
      },
      transitionTimingFunction: {
        fuwari: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      keyframes: {
        grain: {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '10%':      { transform: 'translate(-2%, -3%)' },
          '20%':      { transform: 'translate(3%, 1%)' },
          '30%':      { transform: 'translate(-1%, 4%)' },
          '40%':      { transform: 'translate(2%, -2%)' },
          '50%':      { transform: 'translate(-3%, 1%)' },
          '60%':      { transform: 'translate(1%, 3%)' },
          '70%':      { transform: 'translate(-2%, -1%)' },
          '80%':      { transform: 'translate(3%, 2%)' },
          '90%':      { transform: 'translate(-1%, -3%)' },
        },
      },
      animation: {
        grain: 'grain 0.8s steps(1) infinite',
      },
    },
  },
  plugins: [],
}

export default config
