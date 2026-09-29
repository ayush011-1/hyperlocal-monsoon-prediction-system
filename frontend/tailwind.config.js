/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        agri: {
          primary: '#14532d',    // Deep forest agro green
          primaryLight: '#166534',
          primaryDark: '#052e16',
          secondary: '#0f2942',  // IMD Deep Navy
          secondaryLight: '#1e3a5f',
          accent: '#b45309',     // Earthy harvest amber
          accentLight: '#d97706',
          bg: '#f1f5f9',
          card: '#ffffff',
          sidebar: '#f8fafc',
          border: '#e2e8f0',
          darkBorder: '#cbd5e1',
          gold: '#eab308'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace']
      }
    },
  },
  plugins: [],
}
