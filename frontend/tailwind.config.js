/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Vodling Brand Colors
        primary: {
          50: '#f0f4ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        purple: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7c3aed',
          800: '#6b21a8',
          900: '#581c87',
        },
        vodl: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        hodl: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
        crash: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        // Dark theme colors
        dark: {
          bg: '#050509',
          card: 'rgba(24, 24, 29, 0.5)',
          border: 'rgba(255, 255, 255, 0.07)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #4F46E5, #7C3AED)',
        'gradient-vodl': 'linear-gradient(to right, #1CF2A6, #10B981)',
        'gradient-purple': 'linear-gradient(to right, #a855f7, #ec4899)',
        'gradient-indigo': 'linear-gradient(to right, #6366f1, #8b5cf6)',
      },
      animation: {
        'gradient-move': 'gradient-move 30s ease infinite',
        'pulse-slow': 'pulse 2.5s infinite',
        'fade-in': 'fadeIn 1.2s ease-out forwards',
      },
      keyframes: {
        'gradient-move': {
          '0%': { 'background-position': '0% 50%' },
          '25%': { 'background-position': '50% 0%' },
          '50%': { 'background-position': '100% 50%' },
          '75%': { 'background-position': '50% 100%' },
          '100%': { 'background-position': '0% 50%' },
        },
        'fadeIn': {
          'from': { opacity: '0', transform: 'translateY(20px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        }
      },
      backdropBlur: {
        'xs': '2px',
      }
    },
  },
  plugins: [],
}
