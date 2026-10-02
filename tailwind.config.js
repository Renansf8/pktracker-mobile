/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#0a0a0a",
        "background-secondary": "#111111",
        "background-tertiary": "#1a1a1a",
        border: "#2a2a2a",
        primary: "#22c55e",
        "primary-muted": "#16a34a",
        "text-primary": "#f5f5f5",
        "text-secondary": "#888888",
        "text-muted": "#555555",
        destructive: "#ef4444",
        warning: "#f59e0b",
        info: "#3b82f6",
      },
      fontFamily: {
        display: ["System"],
        data: ["System"],
      },
    },
  },
  plugins: [],
};
