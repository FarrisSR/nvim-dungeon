/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Catppuccin Mocha
        'nvim-base':    '#1e1e2e',
        'nvim-mantle':  '#181825',
        'nvim-crust':   '#11111b',
        'nvim-surface0':'#313244',
        'nvim-surface1':'#45475a',
        'nvim-surface2':'#585b70',
        'nvim-overlay0':'#6c7086',
        'nvim-overlay1':'#7f849c',
        'nvim-overlay2':'#9399b2',
        'nvim-subtext0':'#a6adc8',
        'nvim-subtext1':'#bac2de',
        'nvim-text':    '#cdd6f4',
        'nvim-lavender':'#b4befe',
        'nvim-blue':    '#89b4fa',
        'nvim-sapphire':'#74c7ec',
        'nvim-sky':     '#89dceb',
        'nvim-teal':    '#94e2d5',
        'nvim-green':   '#a6e3a1',
        'nvim-yellow':  '#f9e2af',
        'nvim-peach':   '#fab387',
        'nvim-maroon':  '#eba0ac',
        'nvim-red':     '#f38ba8',
        'nvim-mauve':   '#cba6f7',
        'nvim-pink':    '#f5c2e7',
        'nvim-flamingo':'#f2cdcd',
        'nvim-rosewater':'#f5e0dc',
        // Dungeon
        'dungeon-dark': '#0d0d14',
        'dungeon-stone':'#2a2a3d',
      },
      fontFamily: {
        mono:    ['"JetBrains Mono"', 'monospace'],
        display: ['"UnifrakturMaguntia"', 'cursive'],
        lore:    ['"IM Fell English"', 'serif'],
      },
      keyframes: {
        shake: {
          '0%,100%': { transform: 'translateX(0)' },
          '20%':     { transform: 'translateX(-6px)' },
          '40%':     { transform: 'translateX(6px)' },
          '60%':     { transform: 'translateX(-4px)' },
          '80%':     { transform: 'translateX(4px)' },
        },
        flicker: {
          '0%,100%': { opacity: '1' },
          '50%':     { opacity: '0.85' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        pulse: {
          '0%,100%': { opacity: '1' },
          '50%':     { opacity: '0.4' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%':     { transform: 'translateY(-4px)' },
        },
      },
      animation: {
        shake:          'shake 0.4s ease-in-out',
        flicker:        'flicker 4s ease-in-out infinite',
        fadeIn:         'fadeIn 0.3s ease-out',
        pulse:          'pulse 2s ease-in-out infinite',
        float:          'float 3s ease-in-out infinite',
        'cursor-blink': 'pulse 1s step-end infinite',
      },
    },
  },
  plugins: [],
}
