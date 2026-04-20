import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "rgb(var(--color-bg) / <alpha-value>)",
        "bg-alt": "rgb(var(--color-bg-alt) / <alpha-value>)",
        "bg-deep": "rgb(var(--color-bg-deep) / <alpha-value>)",
        ink: "rgb(var(--color-ink) / <alpha-value>)",
        muted: "rgb(var(--color-muted) / <alpha-value>)",
        line: "rgb(var(--color-line) / <alpha-value>)",
        accent: "rgb(var(--color-accent) / <alpha-value>)",
        "accent-soft": "rgb(var(--color-accent-soft) / <alpha-value>)",
        success: "rgb(var(--color-success) / <alpha-value>)",
        danger: "rgb(var(--color-danger) / <alpha-value>)",
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
      keyframes: {
        // Celebration pop fired when a habit transitions to "done today".
        // Peaks at 45% with a slight overshoot to feel snappy-but-not-jumpy,
        // then settles back to 1 without bouncing again so the row returns
        // to rest cleanly. Respects prefers-reduced-motion via the media
        // query below.
        "habit-pop-done": {
          "0%": { transform: "scale(1)" },
          "45%": { transform: "scale(1.18)" },
          "100%": { transform: "scale(1)" },
        },
        // Subtle row-level flash when a habit completes — a radial-ish
        // background glow that fades from accent-soft back to transparent.
        "habit-row-glow": {
          "0%": { boxShadow: "0 0 0 0 rgb(var(--color-accent) / 0.0)" },
          "40%": { boxShadow: "0 0 0 8px rgb(var(--color-accent) / 0.18)" },
          "100%": { boxShadow: "0 0 0 0 rgb(var(--color-accent) / 0)" },
        },
      },
      animation: {
        "habit-pop-done": "habit-pop-done 450ms cubic-bezier(.2,.8,.3,1.1)",
        "habit-row-glow": "habit-row-glow 600ms ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
