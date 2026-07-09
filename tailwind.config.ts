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
        // Large, slow elliptical drift for the ambient background orbs —
        // each waypoint moves on both axes so the path reads as a loose
        // ellipse rather than a back-and-forth bounce.
        "orb-drift-a": {
          "0%, 100%": { transform: "translate(0, 0)" },
          "25%": { transform: "translate(-70px, 50px)" },
          "50%": { transform: "translate(-30px, 110px)" },
          "75%": { transform: "translate(50px, 40px)" },
        },
        "orb-drift-b": {
          "0%, 100%": { transform: "translate(0, 0)" },
          "25%": { transform: "translate(60px, -40px)" },
          "50%": { transform: "translate(20px, -100px)" },
          "75%": { transform: "translate(-60px, -30px)" },
        },
      },
      animation: {
        converge: "converge 0.7s cubic-bezier(0.16,1,0.3,1) both",
        pulseline: "pulseline 1.6s ease-in-out infinite",
        blink: "blink 1.1s step-end infinite",
        stamp: "stamp 0.5s cubic-bezier(0.34,1.56,0.64,1) both",
        "scroll-left": "scroll-left 26s linear infinite",
        "orb-drift-a": "orb-drift-a 28s ease-in-out infinite",
        "orb-drift-b": "orb-drift-b 30s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
