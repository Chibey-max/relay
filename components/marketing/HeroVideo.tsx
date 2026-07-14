"use client";
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

import { useEffect, useRef, useState } from "react";

export default function HeroVideo({ motionOn, theme }: { motionOn: boolean; theme: "dark" | "light" }) {
  // Fades the video/poster's own top and bottom edges to transparent
  // instead of a hard rectangular cutoff — applied to whichever of the two
  // is actually rendered, so the fade looks identical whether or not
  // reduced-motion swapped the video out for the static poster.
  const edgeFadeStyle = {
    maskImage: "linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)",
    WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)",
  };

  // Fades the whole hero visual out as the user scrolls past it — smoother
  // than an abrupt disappearance once the hero scrolls out of the layout.
  // Scoped to this component's own root so it doesn't need to touch the
  // page's other scroll-driven state (the nav's show/hide tracking).
  const rootRef = useRef<HTMLDivElement>(null);
  const [scrollOpacity, setScrollOpacity] = useState(1);

  useEffect(() => {
    function onScroll() {
      const el = rootRef.current;
      if (!el) return;
      const heroHeight = el.offsetHeight || 1;
      // Fully faded by the time the user has scrolled one hero-height's
      // worth — matches how far the hero itself has scrolled away.
      const progress = Math.min(Math.max(window.scrollY / heroHeight, 0), 1);
      setScrollOpacity(1 - progress);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div ref={rootRef} className="absolute inset-0" style={{ opacity: scrollOpacity }}>
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
      {/* Soft wash, not a heavy shadow — clear at the top (no darkening
          there at all) and only a short, gentle dim confined to roughly
          the bottom quarter. The headline itself carries a text-shadow
          (see app/page.tsx) as its own contrast insurance, so this doesn't
          need to do all the legibility work by itself. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10"
        style={{ background: "linear-gradient(180deg, transparent 0%, transparent 45%, rgba(0,0,0,0.18) 70%, transparent 100%)" }}
      />
      {/* Radial vignette — only in dark mode. In light mode its faint
          reach toward the top/center still read as an unwanted shadow
          over the video, so it's cut entirely there rather than just
          reduced. */}
      {theme === "dark" && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10"
          style={{ background: "radial-gradient(ellipse 90% 70% at 50% 45%, transparent 55%, rgba(0,0,0,0.14) 100%)" }}
        />
      )}
    </div>
  );
}
