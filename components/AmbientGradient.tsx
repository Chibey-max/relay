// components/AmbientGradient.tsx
// A static (non-animated) ambient background wash sitting behind all page
// content — sage green blending toward a warm amber accent, echoing the
// Stax reference's soft two-tone glow instead of a flat page background.
//
// A previous attempt at this (components/AmbientOrb.tsx, since removed)
// read as a visible smudge rather than ambient atmosphere: a fixed 700px
// circle, blurred, animated, and confined to one corner at 2xl+ only. This
// version is deliberately built differently to avoid the same failure:
//   - No filter: blur() at all — the softness comes from the gradient's
//     own multi-stop falloff, which stays smooth at any resolution instead
//     of reading as a rasterized, edged blob.
//   - Percentage-based ellipse sizing (not fixed px), so the gradient's own
//     shape is always larger than its container — there is no "edge" of
//     the shape ever inside the visible viewport, at any width.
//   - Genuinely low opacity (8-10%), no animation, every viewport width
//     (not gated to one breakpoint).
//
// Usage: place once per page, as an early sibling of the page's content
// (before ParticleField, so the particle canvas paints on top of it),
// with position:relative on the page's own root element.
export default function AmbientGradient({
  sageVar = "--mkt-sage",
  amberVar = "--mkt-amber",
}: {
  /** CSS custom property name (no rgb()/var() wrapper) holding the sage RGB triplet for this page's token system. */
  sageVar?: string;
  /** CSS custom property name holding the amber RGB triplet for this page's token system. */
  amberVar?: string;
}) {
  return (
    <div
      aria-hidden="true"
      // z-0 (NOT a negative z-index) — same reasoning as ParticleField:
      // this page's root has no z-index of its own, so a NEGATIVE z-index
      // here would paint behind the root's own opaque background instead
      // of on top of it, hiding the gradient completely. Placed earlier in
      // the DOM than ParticleField so the canvas (also z-0) still paints
      // above it, and both stay below the z-10 content wrapper.
      className="pointer-events-none absolute inset-x-0 top-0 z-0"
      style={{
        height: "120vh",
        background: `
          radial-gradient(ellipse 90% 65% at 18% 0%, rgb(var(${sageVar}) / 0.1) 0%, rgb(var(${sageVar}) / 0.04) 35%, transparent 65%),
          radial-gradient(ellipse 75% 55% at 96% 20%, rgb(var(${amberVar}) / 0.09) 0%, rgb(var(${amberVar}) / 0.03) 35%, transparent 60%)
        `,
      }}
    />
  );
}
