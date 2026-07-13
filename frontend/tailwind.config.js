/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // ⚙️ PERSONALIZAÇÃO: as cores do tema são definidas via CSS vars no theme.config.js
        // e aplicadas via var(--color-primary) etc.
        // Para Tailwind usar essas vars dinamicamente:
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
        accent: 'var(--color-accent)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'serif'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-delay': 'float 6s ease-in-out 2s infinite',
        'float-slow': 'float 8s ease-in-out 1s infinite',
        'pulse-cart': 'pulseCart 0.4s ease-out',
        'fly-to-cart': 'flyToCart 0.6s ease-in forwards',
        'slide-in-right': 'slideInRight 0.35s ease-out',
        'slide-out-right': 'slideOutRight 0.3s ease-in forwards',
        'fade-up': 'fadeUp 0.5s ease-out forwards',
        'stagger-in': 'fadeUp 0.4s ease-out forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '33%': { transform: 'translateY(-12px) rotate(3deg)' },
          '66%': { transform: 'translateY(-6px) rotate(-2deg)' },
        },
        pulseCart: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.35)' },
          '100%': { transform: 'scale(1)' },
        },
        flyToCart: {
          '0%': { transform: 'scale(1) translate(0, 0)', opacity: '1' },
          '80%': { transform: 'scale(0.3) translate(200px, -200px)', opacity: '0.6' },
          '100%': { transform: 'scale(0) translate(250px, -250px)', opacity: '0' },
        },
        slideInRight: {
          from: { transform: 'translateX(100%)', opacity: '0' },
          to: { transform: 'translateX(0)', opacity: '1' },
        },
        slideOutRight: {
          from: { transform: 'translateX(0)', opacity: '1' },
          to: { transform: 'translateX(100%)', opacity: '0' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
