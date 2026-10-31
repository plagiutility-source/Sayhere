import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx,mdx}",
    "./components/**/*.{ts,tsx,mdx}",
    "./lib/**/*.{ts,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Syehere's own product palette (brand-guide.md).
        brand: {
          blue: "#1D4ED8",
          green: "#0E9F6E",
          "yellow-light": "#FFF08A",
          yellow: "#FFC61A",
          navy: "#12307A",
          "green-deep": "#0B7A55",
        },
        // Body text — never pure black (brand-guide.md).
        ink: {
          DEFAULT: "#1F2937",
          muted: "#6B7280",
        },
        // Surfaces.
        surface: {
          DEFAULT: "#FFFFFF",
          muted: "#F7F8FA",
        },
        // Default logo colour + page background per business type.
        preset: {
          "cafe-primary": "#213D36",
          "cafe-secondary": "#C5DBC8",
          "cafe-bg": "#EDF4EE",
          "restaurant-primary": "#A31D1D",
          "restaurant-secondary": "#D4A373",
          "restaurant-bg": "#FAF3EA",
          "salon-primary": "#3E4752",
          "salon-secondary": "#C48A62",
          "salon-bg": "#FBF6F1",
          "gym-primary": "#1F2A37",
          "gym-secondary": "#F26B2B",
          "gym-bg": "#EEF1F4",
          "retail-primary": "#2F5DA8",
          "retail-secondary": "#F2B544",
          "retail-bg": "#EAF1FB",
          "other-primary": "#0F766E",
          "other-secondary": "#F2B544",
          "other-bg": "#E6F4F2",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
        display: [
          "Poppins",
          "Helvetica Neue",
          "Arial",
          "system-ui",
          "sans-serif",
        ],
      },
      fontWeight: {
        // The only two weights allowed in the UI (PRD.md 5.2).
        normal: "400",
        medium: "500",
      },
      // Spacing scale from PRD.md 5.2 (4/8/12/16/20/24/32).
      spacing: {
        xs: "4px",
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "20px",
        "2xl": "24px",
        "3xl": "32px",
      },
      borderRadius: {
        control: "8px",
        card: "12px",
        pill: "9999px",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(15, 23, 42, 0.06), 0 1px 3px rgba(15, 23, 42, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
