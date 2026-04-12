import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Musly brand blue palette
        brand: {
          50:  '#eef5ff',
          100: '#d6eaff',
          200: '#b0d2ff',
          300: '#7db3ff',
          400: '#4a90ff',
          500: '#1a7cfa',   // Primary brand blue
          600: '#1468d6',   // Hover
          700: '#1057b0',   // Active / pressed
          800: '#0d4490',
          900: '#0d2d5e',
          950: '#071529',
        },
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #1a7cfa 0%, #1468d6 100%)',
        'gradient-brand-dark': 'linear-gradient(135deg, #1057b0 0%, #0d2d5e 100%)',
        'gradient-hero': 'linear-gradient(135deg, #060f22 0%, #0d1f3c 50%, #071529 100%)',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fade-in 0.4s ease-out',
        'slide-up': 'slide-up 0.4s ease-out',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
      boxShadow: {
        'brand':    '0 4px 24px -4px rgba(26, 124, 250, 0.28)',
        'brand-lg': '0 8px 40px -8px rgba(26, 124, 250, 0.36)',
        'card':       '0 1px 3px 0 rgba(0,0,0,0.04), 0 4px 12px -2px rgba(0,0,0,0.06)',
        'card-hover': '0 4px 12px -2px rgba(0,0,0,0.08), 0 8px 24px -4px rgba(0,0,0,0.10)',
      },
    },
  },
  plugins: [],
}

export default config
