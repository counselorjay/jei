/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx,vue,svelte}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Helvetica Neue', 'Arial', 'sans-serif'],
        serif: ['ui-serif', 'Georgia', 'Cambria', 'Times New Roman', 'Times', 'serif'],
      },
      colors: {
        ink: {
          900: '#0f172a',
          700: '#1f2937',
          500: '#475569',
          300: '#cbd5e1',
        },
        accent: {
          DEFAULT: '#0e6e6b',
          dark: '#0a4f4d',
          soft: '#e6f1f0',
        },
        warn: {
          DEFAULT: '#a16207',
          soft: '#fef3c7',
        },
      },
      maxWidth: {
        prose: '70ch',
      },
    },
  },
  plugins: [],
};
