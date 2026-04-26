/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        azcon: {
          50:  "#f0f5ff",
          100: "#dbe8ff",
          200: "#bed2ff",
          300: "#91b0ff",
          400: "#5880ff",
          500: "#1e5af1",
          600: "#1343de",
          700: "#0f31b2",
          800: "#122c8f",
          900: "#15296f",
          950: "#0f1840",
        },
      },
    },
  },
  plugins: [],
};
