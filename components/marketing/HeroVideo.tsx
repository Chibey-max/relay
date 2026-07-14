// components/marketing/HeroVideo.tsx
// Hero background video — sits behind the headline/CTAs/phone mockup inside
// the hero <header>. Takes motionOn as a prop (the same reduced-motion
// signal the rest of the page already derives from
// matchMedia("(prefers-reduced-motion: reduce)") — see app/page.tsx)
// instead of re-deriving it here, so there's one source of truth instead of
// a second listener that could drift out of sync with the rest of the page.
//
// When motionOn is false, this renders the poster as a plain <img> instead
// of a <video> element entirely — not a paused video — so no video
// decoding/loading ever happens for a reduced-motion visitor.
export default function HeroVideo({ motionOn }: { motionOn: boolean }) {
  // Fades the video/poster's own top and bottom edges to transparent
  // instead of a hard rectangular cutoff — applied to whichever of the two
  // is actually rendered, so the fade looks identical whether or not
  // reduced-motion swapped the video out for the static poster.
  const edgeFadeStyle = {
    maskImage: "linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)",
    WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)",
  };

  return (
    <>
      {motionOn ? (
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster="/videos/hero-bg-poster.jpg"
          className="absolute inset-0 z-0 h-full w-full object-cover"
          style={edgeFadeStyle}
        >
          <source src="/videos/hero-bg.mp4" type="video/mp4" />
        </video>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- deliberately
        // a plain <img>, not next/image: this is a full-bleed absolute
        // background layer sized by its parent, not a content image that
        // needs Next's responsive-srcset handling.
        <img
          src="/videos/hero-bg-poster.jpg"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 z-0 h-full w-full object-cover"
          style={edgeFadeStyle}
        />
      )}
      {/* Dark gradient + radial vignette so the cream/white headline stays
          legible over whatever's happening in the footage, regardless of
          which frame is showing. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background: `
            linear-gradient(180deg, rgba(0,0,0,0.35), rgba(0,0,0,0.55) 60%, rgba(0,0,0,0.4)),
            radial-gradient(ellipse 80% 60% at 50% 50%, transparent 40%, rgba(0,0,0,0.35) 100%)
          `,
        }}
      />
    </>
  );
}
