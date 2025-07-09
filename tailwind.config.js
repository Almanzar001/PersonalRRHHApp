/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Colores personalizados del sistema de diseño
        'app-bg': '#F7F9FC',
        'app-white': '#FFFFFF',
        'app-primary': '#007BFF',
        'app-secondary': '#E6E9F0',
        'app-text-primary': '#1C1E21',
        'app-text-secondary': '#7D8592',
        'app-border': '#E4E7EC',
        'app-input-border': '#D1D5DB',
        'app-button-secondary': '#F1F3F5',
        'app-button-secondary-hover': '#E2E6EA',
        'app-dark-bg': '#1F2937',
      },
      fontFamily: {
        'sans': ['Inter', 'SF Pro Display', 'Poppins', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'app-title': ['32px', { lineHeight: '1.2', fontWeight: '700' }],
        'app-title-md': ['24px', { lineHeight: '1.3', fontWeight: '700' }],
        'app-subtitle': ['18px', { lineHeight: '1.4', fontWeight: '600' }],
        'app-subtitle-md': ['16px', { lineHeight: '1.4', fontWeight: '500' }],
        'app-body': ['16px', { lineHeight: '1.5', fontWeight: '400' }],
        'app-body-sm': ['14px', { lineHeight: '1.5', fontWeight: '400' }],
      },
      borderRadius: {
        'app-card': '16px',
        'app-card-sm': '12px',
        'app-button': '8px',
      },
      boxShadow: {
        'app-card': '0 1px 4px rgba(0, 0, 0, 0.06)',
        'app-card-hover': '0 4px 12px rgba(0, 0, 0, 0.1)',
      },
      spacing: {
        'app-card': '16px',
        'app-button-x': '20px',
        'app-button-y': '12px',
      },
      transitionDuration: {
        'app': '200ms',
      },
      transitionTimingFunction: {
        'app': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
};