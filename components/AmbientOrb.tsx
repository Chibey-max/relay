// components/AmbientOrb.tsx
// A large, softly blurred radial-gradient circle drifting behind the page
// on wide viewports — fills the empty side margins with ambient motion
// instead of dead space. Restrained to the monochrome palette (--c-line),
// no color, no heavy glow. Motion is governed entirely by the existing
// .motion-off class on <main> (see globals.css) — no separate JS needed,
// the same mechanism every other animated element in the app already uses.

export default function AmbientOrb({
  className = "",
  variant = "a",
}: {
  className?: string;
  variant?: "a" | "b";
}) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute -z-10 hidden rounded-full 2xl:block ${
        variant === "a" ? "animate-orb-drift-a" : "animate-orb-drift-b"
      } ${className}`}
      style={{
        width: 700,
        height: 700,
        background: "radial-gradient(circle, rgb(var(--c-chalk)) 0%, transparent 70%)",
        opacity: 0.17,
        filter: "blur(60px)",
      }}
    />
  );
}
