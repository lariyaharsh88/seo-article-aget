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
        background: "#040c16",
        surface: "#07111c",
        border: "#1e2d3d",
        accent: "#f59e0b",
        "accent-dim": "#78350f",
        "text-primary": "#f1f5f9",
        "text-secondary": "#94a3b8",
        "text-muted": "#475569",
        success: "#10b981",
        info: "#06b6d4",
        purple: "#a78bfa",
      },
      fontFamily: {
        display: ["var(--font-abril)", "serif"],
        serif: ["var(--font-lora)", "serif"],
        mono: ["var(--font-space-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
