/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.html",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fefdf8',
          100: '#fdf9e8',
          200: '#faf1c7',
          300: '#f6e59c',
          400: '#f1d470',
          500: '#edc047',
          600: '#d4a53a',
          700: '#b08430',
          800: '#8f6a2e',
          900: '#775729',
          950: '#442f13',
        },
        bakery: {
          brown: '#8B4513',
          cream: '#F5F5DC',
          wheat: '#F5DEB3',
          crust: '#DEB887',
        }
      },
      fontFamily: {
        sans: ['Inter Variable', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
        display: ['Playfair Display', 'serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'bounce-gentle': 'bounceGentle 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
      },
      screens: {
        '3xl': '1600px',
      },
    },
  },
  plugins: [
    // Add forms plugin for better form styling
    function({ addUtilities }) {
      addUtilities({
        '.bg-pattern-dots': {
          'background-image': 'radial-gradient(circle, #000 1px, transparent 1px)',
          'background-size': '20px 20px',
        },
        '.text-shadow': {
          'text-shadow': '2px 2px 4px rgba(0, 0, 0, 0.1)',
        },
        '.text-shadow-lg': {
          'text-shadow': '4px 4px 8px rgba(0, 0, 0, 0.2)',
        },
        '.bakery-gradient': {
          'background': 'linear-gradient(135deg, #F5DEB3 0%, #DEB887 50%, #D2B48C 100%)',
        },
      });
    },
  ],
};