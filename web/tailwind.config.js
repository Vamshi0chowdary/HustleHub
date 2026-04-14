/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        appBg: 'var(--color-bg)',
        appSurface: 'var(--color-surface)',
        appCard: 'var(--color-card)',
        appText: 'var(--color-text-primary)',
        appSubtext: 'var(--color-text-secondary)',
        appMuted: 'var(--color-text-muted)',
        appAccent: 'var(--color-accent)',
      },
      boxShadow: {
        premium: 'var(--shadow-elev)',
        'premium-hover': 'var(--shadow-elev-hover)',
      },
      borderRadius: {
        premium: '24px',
      },
    },
  },
  plugins: [],
}