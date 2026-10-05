/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
      },
      colors: {
        // "navy" now doubles as the dark-brown chrome scale used for the
        // sidebar, header surfaces and elevated dark panels.
        navy: {
          50: "#F5EDE6",
          100: "#E4D4C6",
          400: "#5A4A3E",
          600: "#241B16",
          700: "#120E0C", // sidebar
          800: "#0C0908",
          900: "#080605",
        },
        // "brand" = primary orange, used for buttons, active states,
        // key metrics and chart highlights.
        brand: {
          50: "#FFF3E8",
          100: "#FFE2C7",
          200: "#FFC58C",
          300: "#FFA652",
          400: "#FF8A2E",
          500: "#F97316", // primary orange
          600: "#EA580C",
          700: "#C2410C",
          800: "#9A3412",
          900: "#7C2D12",
        },
        // Secondary warm amber, used sparingly for highlights/positive data
        teal: {
          50: "#FEF7E6",
          400: "#FBBF24",
          600: "#F59E0B", // warm amber
          700: "#B45309",
          800: "#78350F",
        },
        // Dark financial-SaaS surfaces
        surface: "#17120F", // primary background
        surface2: "#211914", // secondary background
        card: "#2A211C",
        cardHover: "#332720",
        ink: {
          900: "#F5EDE6", // primary text (cream)
          600: "#C9BAAE",
          400: "#A99A90", // secondary text
          300: "#756960", // muted text
        },
        line: "#44362E", // border
        status: {
          approved: "#22C55E",
          approvedBg: "#16301F",
          pending: "#F97316",
          pendingBg: "#3A2510",
          rejected: "#EF4444",
          rejectedBg: "#3A1616",
          info: "#F97316",
          infoBg: "#3A2510",
          draft: "#A99A90",
          draftBg: "#2A211C",
        },
      },
      boxShadow: {
        card: "0 1px 2px 0 rgba(0,0,0,0.25), 0 1px 3px 0 rgba(0,0,0,0.3)",
        elevated: "0 4px 16px -2px rgba(0,0,0,0.4), 0 2px 6px -2px rgba(0,0,0,0.3)",
        popover: "0 12px 32px -8px rgba(0,0,0,0.55)",
        glow: "0 0 0 1px rgba(249,115,22,0.15), 0 0 20px -4px rgba(249,115,22,0.25)",
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.125rem",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: 0, transform: "translateY(-4px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: 0, transform: "scale(0.97)" },
          "100%": { opacity: 1, transform: "scale(1)" },
        },
      },
      animation: {
        fadeIn: "fadeIn 0.15s ease-out",
        scaleIn: "scaleIn 0.15s ease-out",
      },
    },
  },
  plugins: [],
};
