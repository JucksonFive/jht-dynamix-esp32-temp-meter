/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#fff1f2",
          100: "#ffe4e6",
          200: "#fecdd3",
          300: "#fda4af",
          400: "#fb7185",
          500: "#e11d48",
          600: "#be123c",
          700: "#9f1239",
          800: "#881337",
          900: "#4c0519",
        },
        neutral: {
          50: "#fdf8f8",
          100: "#f9f5f5",
          200: "#f0e5e5",
          300: "#d4d4d4",
          400: "#a3a3a3",
          500: "#737373",
          600: "#525252",
          700: "#404040",
          800: "#262626",
          900: "#171717",
        },
        accent: {
          50: "#fff1f2",
          100: "#ffe4e6",
          200: "#fecdd3",
          400: "#fb7185",
          500: "#e11d48",
          600: "#be123c",
          700: "#9f1239",
        },
        status: {
          cold: "#3b82f6",
          normal: "#22c55e",
          warm: "#eab308",
          hot: "#ef4444",
        },
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.08)",
      },
    },
  },
  plugins: [],
};
