const token = (name) => `rgb(var(--${name}) / <alpha-value>)`

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: token('bg'),
        card: token('card'),
        ink: token('ink'),
        mute: token('mute'),
        line: token('line'),
        acc: token('acc'),
        amb: token('amb'),
        ambbg: token('ambbg'),
        danger: token('danger'),
        map: token('map'),
        road: token('road'),
        water: token('water'),
        ok: token('ok'),
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
