import type { Config } from 'tailwindcss'

export default {
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './app.vue',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          base: '#0f0f14',
          card: '#1a1a24',
          hover: '#22222e',
        },
        border: {
          DEFAULT: '#2a2a3a',
          light: '#3a3a4e',
        },
        signal: {
          green: '#00d68f',
          yellow: '#ffb700',
          orange: '#ff7f00',
          red: '#ff4757',
          blue: '#4facfe',
        },
        btc: '#f7931a',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Roboto Mono', 'monospace'],
      },
      animation: {
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 3s linear infinite',
      }
    },
  },
  plugins: [],
} satisfies Config
