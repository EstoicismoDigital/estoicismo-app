import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#FFFFFF",
        "bg-alt": "#F5F1EA",
        "bg-deep": "#0A0A0A",
        ink: "#0A0A0A",
        muted: "#5E5E5E",
        line: "#E5E1DA",
        accent: "#8B6F47",
        "accent-soft": "#C9A87A",
        success: "#2D7A4F",
        danger: "#B3261E",
      },
      fontFamily: {
        display: ["var(--font-lora)", "Georgia", "serif"],
        body: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        card: "12px",
        modal: "20px",
      },
    },
  },
  plugins: [],
};

export default config;
