/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        'app-bg': '#93cec1ff', 
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        finsync: {
          primary: "#059669",
          secondary: "#0f766e",
          accent: "#0284c7",
          neutral: "#1f2937",
          "base-100": "#ffffff",
          "base-200": "#f8fafc",
          "base-300": "#e2e8f0",
          info: "#0ea5e9",
          success: "#10b981",
          warning: "#f59e0b",
          error: "#ef4444",
        },
      },
      "light",
    ],
  },
}
