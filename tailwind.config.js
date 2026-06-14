/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Google Sans Flex"', '"Roboto Flex"', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
