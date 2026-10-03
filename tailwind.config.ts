import type { Config } from "tailwindcss";

// Тёмная «индустриальная» палитра: почти чёрный фон, светлый текст, фирменный красный.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0B0B0D",
        coal: "#131316",
        slate: "#1C1C21",
        paper: "#F5F4F0",
        mist: "#A6A6AD",
        dim: "#6E6E76",
        line: "rgba(255,255,255,0.10)",
        accent: "#E4142F",
        accentDark: "#B80E24",
        accentHover: "#FF2D48",
      },
      fontFamily: {
        display: ["var(--font-display)", "Impact", "Arial Narrow", "sans-serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      maxWidth: { wrap: "1440px" },
      keyframes: {
        ticker: { from: { transform: "translateX(0)" }, to: { transform: "translateX(-50%)" } },
        tickerReverse: { from: { transform: "translateX(-50%)" }, to: { transform: "translateX(0)" } },
        pulseDot: { "0%,100%": { boxShadow: "0 0 0 0 rgba(228,20,47,0.7)" }, "70%": { boxShadow: "0 0 0 12px rgba(228,20,47,0)" } },
        scrollHint: { "0%": { transform: "translateY(-100%)" }, "100%": { transform: "translateY(100%)" } },
        progress: { from: { width: "0%" }, to: { width: "100%" } },
      },
      animation: {
        ticker: "ticker 55s linear infinite",
        tickerReverse: "tickerReverse 65s linear infinite",
        pulseDot: "pulseDot 2.2s ease-out infinite",
        scrollHint: "scrollHint 1.8s cubic-bezier(0.65,0,0.35,1) infinite",
        progress: "progress 4.5s linear forwards",
      },
    },
  },
  plugins: [],
};

export default config;
