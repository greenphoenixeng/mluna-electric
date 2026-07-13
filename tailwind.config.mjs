/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        // M Luna Electric brand palette (finalize with client)
        navy: {
          900: '#0a0f1e',
          800: '#0d1526',
          700: '#1a2542',
        },
        electric: {
          400: '#facc15', // amber/yellow accent
          500: '#eab308',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Montserrat', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
