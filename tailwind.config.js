/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./components/**/*.{js,vue,ts}",
    "./layouts/**/*.vue",
    "./pages/**/*.vue",
    "./plugins/**/*.{js,ts}",
    "./app.vue",
    "./error.vue",
  ],
  theme: {
    extend: {
      colors: {
        // SAP Fiori Color Palette
        'fiori-blue': {
          50: '#E5F0FF',
          100: '#B8D9FF',
          200: '#8AC2FF',
          300: '#5CABFF',
          400: '#2E94FF',
          500: '#0070F2', // Primary
          600: '#0057D2',
          700: '#0040B0',
          800: '#00298E',
          900: '#00126C',
        },
        'fiori-gray': {
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#E5E5E5',
          300: '#CCCCCC',
          400: '#999999',
          500: '#666666',
          600: '#333333',
          700: '#1F1F1F',
          800: '#0F0F0F',
          900: '#000000',
        },
        'fiori-success': '#107E3E',
        'fiori-warning': '#FFB300',
        'fiori-error': '#E60000',
        'fiori-info': '#0070F2',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
  safelist: [
    // Ensure dynamic gap classes are included
    'gap-1', 'gap-2', 'gap-3', 'gap-4', 'gap-6', 'gap-8',
    // Grid columns
    'grid-cols-1', 'grid-cols-2', 'grid-cols-3', 'grid-cols-4',
    'md:grid-cols-2', 'md:grid-cols-3', 'md:grid-cols-4',
    'lg:grid-cols-2', 'lg:grid-cols-3', 'lg:grid-cols-4',
  ],
}
