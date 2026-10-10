/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './src/app/**/*.{js,jsx,ts,tsx}',
    './src/components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        consumidor: {
          DEFAULT: '#008D4C',
          primary: '#008D4C',
          secondary: '#E7F5ED',
          dark: '#006B3A',
        },
        lojista: {
          DEFAULT: '#6F35B5',
          primary: '#6F35B5',
          secondary: '#EEE7F7',
          dark: '#582A91',
        },
        pontos: {
          DEFAULT: '#F5B800',
          primary: '#F5B800',
          secondary: '#FEF8E6',
          dark: '#D49E00',
        },
        neutros: {
          fundo: '#F7F8FA',
          texto: '#171717',
          branco: '#FFFFFF',
          borda: '#E5E7EB',
          cinza: '#666666',
          cinzaClaro: '#F3F4F6',
        },
        primary: '#008D4C',
        secondary: '#6F35B5',
        points: '#F5B800',
      },
    },
  },
  plugins: [],
};
