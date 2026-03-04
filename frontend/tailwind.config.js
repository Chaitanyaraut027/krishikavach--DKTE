/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        muted: 'var(--text-muted)',
        accent: 'var(--text-accent)',
        page: 'var(--bg-page)',
        'card-hover': 'var(--bg-card-hover)',
        'border-card': 'var(--border-card)',
      },
      backgroundColor: {
        page: 'var(--bg-page)',
        'page-2': 'var(--bg-page-2)',
        card: 'var(--bg-card)',
      }
    },
  },
  plugins: [],
}









