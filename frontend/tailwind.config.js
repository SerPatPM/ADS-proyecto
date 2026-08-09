/**
 * Prompt: "Configuración de Tailwind con colores semánticos
 * (acento, superficie, primary, secondary, muted, hover, white)
 * mapeados a variables CSS. Fuente mono: SF Mono / JetBrains Mono."
 */

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        acento: {
          DEFAULT: '#6366f1',
          light: '#818cf8',
          dark: '#4f46e5',
        },
        superficie: {
          DEFAULT: 'var(--color-superficie)',
          elevado: 'var(--color-elevado)',
          borde: 'var(--color-borde)',
        },
        primary: 'var(--color-texto)',
        secondary: 'var(--color-texto-secundario)',
        muted: 'var(--color-texto-muted)',
        hover: 'var(--color-hover)',
        white: 'var(--color-white)',
      },
      fontFamily: {
        mono: ['"SF Mono"', '"JetBrains Mono"', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}
