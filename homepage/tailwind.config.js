/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        midnight: {
          900: "#0d1017",
          800: "#141924",
          700: "#1c2330",
          600: "#252f40",
        },
        neon: {
          purple: "#805ad5",
          fuchsia: "#d946ef",
          pink: "#ec4899",
          blue: "#6366f1",
          cyan: "#06b6d4",
        },
      },
      backgroundImage: {
        "gradient-dashboard":
          "radial-gradient(circle at 20% 20%, rgba(124,58,237,0.15), transparent 60%), radial-gradient(circle at 80% 30%, rgba(6,182,212,0.12), transparent 65%), linear-gradient(135deg, #111827 0%, #1f2937 60%, #0f172a 100%)",
      },
      boxShadow: {
        "glow-purple":
          "0 0 0 1px rgba(124,58,237,0.4), 0 4px 24px -4px rgba(124,58,237,0.35)",
        "inner-soft": "inset 0 1px 0 0 rgba(255,255,255,0.04)",
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};
