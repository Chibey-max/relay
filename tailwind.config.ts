import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Colors reference CSS variables (see globals.css) so the
        // dark/light toggle works by flipping a class, not by duplicating
        // every utility class across two color sets. Wrapped in
        // rgb(... / <alpha-value>) — not just var(--c-x) — so Tailwind's
        // opacity modifiers (border-line/40, bg-check/30, etc.) actually
        // splice in an alpha channel instead of silently falling back to
        // the default gray border/bg color.
        ink: "rgb(var(--c-ink) / <alpha-value>)",
        slate: "rgb(var(--c-slate) / <alpha-value>)",
        slate2: "rgb(var(--c-slate2) / <alpha-value>)",
        line: "rgb(var(--c-line) / <alpha-value>)",
        line2: "rgb(var(--c-line2) / <alpha-value>)",
        chalk: "rgb(var(--c-chalk) / <alpha-value>)",
        mist: "rgb(var(--c-mist) / <alpha-value>)",
        dim: "rgb(var(--c-dim) / <alpha-value>)",
        check: "rgb(var(--c-check) / <alpha-value>)",
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      keyframes: {
        converge: {
          "0%": { transform: "translateY(18px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        pulseline: {
          "0%,100%": { opacity: "1" },
          "50%": { opacity: "0.3" },
        },
        blink: {
          "0%,100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
        stamp: {
          "0%": { opacity: "0", transform: "scale(0.85)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "scroll-left": {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
        // Left-to-right reveal for the "You type" node's typed-out detail
        // line in ArchitectureFlow, replayed each loop via a remount key.
        typewriter: {
          from: { clipPath: "inset(0 100% 0 0)" },
          to: { clipPath: "inset(0 0% 0 0)" },
        },
      },
      animation: {
        converge: "converge 0.7s cubic-bezier(0.16,1,0.3,1) both",
        pulseline: "pulseline 1.6s ease-in-out infinite",
        blink: "blink 1.1s step-end infinite",
        stamp: "stamp 0.5s cubic-bezier(0.34,1.56,0.64,1) both",
        "scroll-left": "scroll-left 26s linear infinite",
        typewriter: "typewriter 0.7s steps(20,end) 1",
      },
    },
  },
  plugins: [],
};
export default config;
