"use client";
// components/marketing/TrustPanel.tsx
// Theme-reactive panel — uses the same --mkt-card/--mkt-ink tokens as the
// rest of the page, so it flips light/dark along with everything else.
// Contains a tilted mini-phone whose SCREEN is also theme-reactive (same
// tokens as the hero phone) and crossfades between the two REAL, verified
// transactions — these hashes and the contract address are real, kept
// verbatim (see components/marketing/realSends.ts).

import { useRealSendCycle } from "./useRealSendCycle";

export default function TrustPanel({ motionOn }: { motionOn: boolean }) {
  const { idx, visible, current } = useRealSendCycle(motionOn);

  return (
    <div
      className="mkt-trust-panel rounded-xl p-8 sm:p-10"
      style={{ background: "rgb(var(--mkt-card))", color: "rgb(var(--mkt-ink))" }}
    >
      <div className="grid items-center gap-10 md:grid-cols-[0.85fr_1.15fr]">
        <div className="relative flex min-w-0 items-center justify-center py-8">
          {/* No local glow here — the page-level AmbientGradient already
              supplies atmosphere behind this whole section. A second,
              separate blur here used to double up with it and read as an
              uneven, "dirty" patch rather than clean ambient light. */}
          {/* Reserves the footprint the tilted phone ACTUALLY occupies once
              rendered, not just its flat scaled size. A rotateY/rotateX
              perspective transform visually grows the bounding box beyond
              the flat width*height*scale math — measured via
              getBoundingClientRect at every breakpoint: the rendered phone
              is ~1.30x wider and ~1.05x taller than its flat footprint, and
              that ratio holds constant across the 0.62/0.85/1 scale steps.
              Sizing this box to match (rather than the flat footprint)
              keeps the phone fully inside its allotted space instead of
              spilling past it on mobile and desktop alike. */}
          <div
            className="relative w-full max-w-[176px] sm:max-w-[239px] lg:max-w-[280px]"
            style={{ aspectRatio: "280 / 492", perspective: "1400px" }}
          >
            <div
              // Fixed 216px design width, never responsive — only the
              // transform scales it (via --phone-scale), so nothing inside
              // ever reflows or collides at smaller sizes; it's the same
              // layout at every size, just visually bigger or smaller as
              // one image.
              // Mobile-only: a left-right drift (animate-float-phone-mobile)
              // instead of the sm+ vertical bounce (animate-float-phone) —
              // the sm: variant simply overrides the base class at that
              // breakpoint since both set the same "animation" property.
              className={`absolute left-1/2 top-1/2 w-[216px] rounded-[36px] p-2.5 [--phone-scale:0.62] sm:[--phone-scale:0.85] lg:[--phone-scale:1] ${motionOn ? "animate-float-phone-mobile sm:animate-float-phone" : ""}`}
              style={{
                aspectRatio: "9 / 19.5",
                background:
                  "linear-gradient(160deg, rgb(var(--mkt-card)) 0%, rgb(var(--mkt-line)) 22%, rgb(var(--mkt-card)) 48%, rgb(var(--mkt-line)) 76%, rgb(var(--mkt-card)) 100%)",
                // Real 3D tilt (perspective + rotateX/rotateY) instead of a
                // flat in-plane rotate() — the phone now recedes in depth
                // rather than just spinning like a flat rotated photo.
                // rotateZ adds a residual lean on top of that. rotateY is
                // POSITIVE (not negative) — verified empirically that this
                // is the sign that compresses the RIGHT edge into depth
                // while the LEFT edge stays larger/closer to the viewer;
                // the negative sign produces the mirror image. Bumped
                // several times (10 -> 18 -> 26 -> 29deg) so the phone reads
                // as facing toward the text column on the right more
                // distinctly. Kept in sync with the float-phone keyframe's
                // resting angle in tailwind.config.ts.
                transform: "translate(-50%, -50%) scale(var(--phone-scale)) rotateY(29deg) rotateX(4deg) rotateZ(-8deg)",
                transformStyle: "preserve-3d",
                boxShadow:
                  "0 40px 80px -20px rgba(0,0,0,0.5), 0 15px 30px -15px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -1px 1px rgba(0,0,0,0.25)",
              }}
            >
            {/* Side buttons, scaled down to match this phone's smaller frame */}
            <div
              className="absolute -right-[1.5px] top-[26%] h-[42px] w-[2px] rounded-l-sm"
              style={{ background: "linear-gradient(90deg, rgb(var(--mkt-muted2)) 0%, rgb(var(--mkt-line)) 100%)", boxShadow: "1px 0 1px rgba(0,0,0,0.2)" }}
            />
            <div
              className="absolute -right-[1.5px] top-[42%] h-[24px] w-[2px] rounded-l-sm"
              style={{ background: "linear-gradient(90deg, rgb(var(--mkt-muted2)) 0%, rgb(var(--mkt-line)) 100%)", boxShadow: "1px 0 1px rgba(0,0,0,0.2)" }}
            />

            <div className="relative flex h-full flex-col overflow-hidden rounded-[26px]" style={{ background: "rgb(var(--mkt-card))" }}>
              <div className="grid h-8 shrink-0 grid-cols-[1fr_auto_1fr] items-center px-3.5" style={{ color: "rgb(var(--mkt-ink))" }}>
                <span className="font-mono text-[10px] font-medium">9:41</span>
                <div className="relative h-[15px] w-[52px] justify-self-center rounded-lg" style={{ background: "rgb(var(--mkt-fixed-dark))" }}>
                  <span
                    aria-hidden
                    className="absolute right-1.5 top-1/2 h-[4px] w-[4px] -translate-y-1/2 rounded-full"
                    style={{ background: "radial-gradient(circle at 35% 35%, #3f3f3f, #050505 70%)" }}
                  />
                </div>
                <span className="flex items-center justify-end gap-[3px]">
                  <svg width="12" height="8" viewBox="0 0 16 11" fill="none">
                    <rect x="0" y="7" width="3" height="4" rx="0.6" fill="currentColor" />
                    <rect x="4.5" y="5" width="3" height="6" rx="0.6" fill="currentColor" />
                    <rect x="9" y="3" width="3" height="8" rx="0.6" fill="currentColor" />
                    <rect x="13.5" y="0.5" width="3" height="10.5" rx="0.6" fill="currentColor" />
                  </svg>
                  <svg width="11" height="8" viewBox="0 0 15 11" fill="none">
                    <path d="M1 4.2C4.8 0.8 10.2 0.8 14 4.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                    <path d="M3.3 6.8C5.9 4.5 9.1 4.5 11.7 6.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                    <circle cx="7.5" cy="9.3" r="1.1" fill="currentColor" />
                  </svg>
                  <svg width="18" height="9" viewBox="0 0 25 12" fill="none">
                    <rect x="0.75" y="0.75" width="20.5" height="10.5" rx="2.75" stroke="currentColor" strokeWidth="1" />
                    <rect x="2.25" y="2.25" width="17.5" height="7.5" rx="1.5" fill="currentColor" />
                    <rect x="22" y="4" width="2" height="4" rx="1" fill="currentColor" />
                  </svg>
                </span>
              </div>
              <div
                className="flex flex-1 flex-col items-center overflow-y-auto px-4 pb-4 pt-4 text-center"
                style={{ justifyContent: "safe center" }}
              >
                <div
                  key={idx}
                  className="mb-3 flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full animate-stamp"
                  style={{ background: "rgb(var(--mkt-sage))" }}
                >
                  <span className="text-lg text-white">✓</span>
                </div>
                <div className={`w-full transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`}>
                  <h5 className="font-display text-sm font-medium" style={{ color: "rgb(var(--mkt-ink))" }}>
                    Sent.
                  </h5>
                  <p className="mb-3 text-[11px]" style={{ color: "rgb(var(--mkt-muted))" }}>
                    {current.title}
                  </p>
                  <div className="w-full rounded-lg border p-2.5 text-left text-[10px]" style={{ background: "rgb(var(--mkt-cream))", borderColor: "rgb(var(--mkt-line))" }}>
                    {[
                      ["Network fee", "Sponsored"],
                      ["Settled on", "Arbitrum"],
                      ["Status", "Confirmed"],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between py-0.5" style={{ color: "rgb(var(--mkt-muted))" }}>
                        <span>{k}</span>
                        <b className="font-medium" style={{ color: "rgb(var(--mkt-ink))" }}>
                          {v}
                        </b>
                      </div>
                    ))}
                  </div>
                  {current.href ? (
                    <a
                      href={current.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2.5 inline-block font-mono text-[10px] underline-offset-2 hover:underline"
                      style={{ color: "rgb(var(--mkt-sage))" }}
                    >
                      {current.hash} ↗
                    </a>
                  ) : (
                    <div className="mt-2.5 font-mono text-[10px]" style={{ color: "rgb(var(--mkt-sage))" }}>
                      {current.hash} ↗
                    </div>
                  )}
                </div>
                <div className="mt-3 flex shrink-0 gap-1.5">
                  {[0, 1].map((i) => (
                    <span
                      key={i}
                      className="h-1 w-1 rounded-full transition-colors"
                      style={{ background: i === idx ? "rgb(var(--mkt-sage))" : "rgb(var(--mkt-line))" }}
                    />
                  ))}
                </div>
              </div>

              {/* Screen glare — matches the hero phone's treatment */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-[26px]"
                style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 40%)" }}
              />
            </div>
          </div>
          </div>
        </div>

        <div>
          <p className="mb-2 font-mono text-xs uppercase tracking-widest" style={{ color: "rgb(var(--mkt-sage))" }}>
            A record that can&apos;t be edited
          </p>
          <h2 className="mb-3 font-display text-2xl font-medium sm:text-3xl">Parsed. Sponsored. Settled.</h2>
          <p className="mb-6 text-sm" style={{ color: "rgb(var(--mkt-muted))" }}>
            Every real send is signed and public. You check the numbers, not the marketing.
          </p>
          <div className="space-y-0">
            {[
              ["01", "Parsed", "Your sentence becomes an exact instruction — recipient, amount, chain — shown to you before anything moves."],
              ["02", "Sponsored", "The network fee is paid for you. Nothing is held back for gas."],
              ["03", "Settled", "A real transaction, signed on-chain, checkable in under a minute on Arbiscan."],
            ].map(([num, h, p]) => (
              <div key={num} className="border-t py-4" style={{ borderColor: "rgb(var(--mkt-line))" }}>
                <div className="mb-2 font-mono text-xs" style={{ color: "rgb(var(--mkt-sage))" }}>{num}</div>
                <h4 className="mb-1.5 font-medium">{h}</h4>
                <p className="text-sm" style={{ color: "rgb(var(--mkt-muted))" }}>
                  {p}
                </p>
              </div>
            ))}
          </div>
          <a
            href="https://arbiscan.io/tx/0x118ff441d1bb070c000b74a940ebc3637dfd3d989781321bd8ec47b22f80dcfe"
            target="_blank"
            rel="noreferrer"
            className="mt-8 inline-block border-b pb-0.5 font-mono text-sm hover:border-opacity-70"
            style={{ borderColor: "rgb(var(--mkt-line))" }}
          >
            View the live transaction →
          </a>
        </div>
      </div>
    </div>
  );
}
