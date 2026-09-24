/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Cores principais da Zeu-Tech (ciano elétrico / azul tech)
        primary: {
          50:  '#e0f7ff',
          100: '#b3edff',
          200: '#80e2ff',
          300: '#4dd6ff',
          400: '#26ccff',
          500: '#00c8ff', // Ciano principal Zeu-Tech
          600: '#00a3d1',
          700: '#007fa4',
          800: '#005c77',
          900: '#003a4a',
        },
        // Orange redefinido para ciano — mantém compatibilidade com todos os componentes
        orange: {
          50:  '#e0f7ff',
          100: '#b3edff',
          200: '#80e2ff',
          300: '#4dd6ff',
          400: '#26ccff',
          500: '#00c8ff', // Ciano principal Zeu-Tech
          600: '#00a3d1',
          700: '#007fa4',
          800: '#005c77',
          900: '#003a4a',
        },
        // Azul escuro de fundo da identidade Zeu-Tech
        brand: {
          dark:    '#060d30',
          navy:    '#0d1f4d',
          blue:    '#0057b8',
          cyan:    '#00c8ff',
          'cyan-glow': '#00e5ff',
        },
        // Tons de cinza (mantidos)
        secondary: {
          50:  '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        slate: {
          50:  '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
      },
    },
  },
  plugins: [],
}