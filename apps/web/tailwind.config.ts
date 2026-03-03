import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
        },
        accent: {
          cyan: "#06b6d4",
          pink: "#ec4899",
          amber: "#f59e0b",
          emerald: "#10b981",
        },
        bg: {
          dark: "#0f0f1a",
          card: "#1a1a2e",
          elevated: "#252542",
        },
      },
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
