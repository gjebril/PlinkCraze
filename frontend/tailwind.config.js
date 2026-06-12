/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "dark-blue": "#20262E",
        "dark-blue-secondary": "#2a313b",
        "light-gray": "#a9cde2",
        "dark-gray": "#2f4553",
        "highlight-green": "#00e700",
      }
    },
  },
  plugins: [],
};
