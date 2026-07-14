"use client";
// app/page.tsx
// Marketing landing page ("/"). Ported from
// design-reference/relay-landing-v10 (1).html into real components — the
// wallet-connected product lives at /app, and this page is purely
// decorative/informational. No SDK imports, no /api/* calls: everything
// here is static copy or local animation state.

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useReveal } from "../lib/useReveal";
import ParticleField from "../components/ParticleField";
import AmbientGradient from "../components/AmbientGradient";
import NavMenu from "../components/NavMenu";
import PhoneMock from "../components/marketing/PhoneMock";
import HeroVideo from "../components/marketing/HeroVideo";
import TxTicker from "../components/marketing/TxTicker";
import QuoteCarousel from "../components/marketing/QuoteCarousel";
import TrustPanel from "../components/marketing/TrustPanel";
import FaqAccordion from "../components/marketing/FaqAccordion";
import ArchitectureFlow from "../components/ArchitectureFlow";
import "./marketing.css";

const STRIP = [
  { h: "Real transfers", p: "Live on Arbitrum mainnet, not a simulation." },
  { h: "No seed phrase", p: "Log in with email. Your wallet is created for you." },
  { h: "We cover the gas", p: "Every network fee is sponsored while this is live." },
  { h: "One balance, any chain", p: "Relay treats what you own as a single balance." },
];

const STEPS = [
  { n: "01", h: "Speak", p: "Type it the way you'd text a friend. Relay reads the intent, not a form." },
  { n: "02", h: "Unify", p: "Relay treats what you own across chains as one balance — no picking a network first." },
  { n: "03", h: "Settle", p: "Sent for real, gas covered, with a receipt you can verify yourself." },
];

const FEATURE_CARDS = [
  { h: "No jargon, ever", p: "Describe a payment in plain words. Relay handles the chain, the gas, and the routing behind it." },
  {
    h: "Trust you can check",
    p: "Every real send links straight to the transaction on Arbiscan — not a screenshot, the actual record.",
    hashes: ["0x118ff4…0dcfe", "0x065631…f839e"],
  },
  { h: "One balance, any chain", p: "Your funds don't need to already be in the right place. Relay finds them and unifies the view." },
  { h: "We cover the gas", p: "No ETH sitting idle just to pay network fees. Sponsorship is built into every send." },
];

function Reveal({
  children,
  className = "",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const { ref, className: revealClass } = useReveal<HTMLDivElement>();
  return (
    <div ref={ref} className={`${revealClass} ${className}`} style={style}>
      {children}
    </div>
  );
}

export default function MarketingPage() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [motionOn, setMotionOn] = useState(true);
  const themeToggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("relayTheme") as "dark" | "light" | null;
    if (saved) setTheme(saved);
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) setMotionOn(false);
  }, []);

  async function handleThemeToggle() {
    const next = theme === "dark" ? "light" : "dark";
    localStorage.setItem("relayTheme", next);
    if (!document.startViewTransition || !themeToggleRef.current) {
      setTheme(next);
      return;
    }
    const btn = themeToggleRef.current;
    const { top, left, width, height } = btn.getBoundingClientRect();
    const cx = left + width / 2;
    const cy = top + height / 2;
    const endRadius = Math.hypot(
      Math.max(cx, window.innerWidth - cx),
      Math.max(cy, window.innerHeight - cy)
    );
    const transition = document.startViewTransition(() => setTheme(next));
    await transition.ready;
    document.documentElement.animate(
      { clipPath: [`circle(0px at ${cx}px ${cy}px)`, `circle(${endRadius}px at ${cx}px ${cy}px)`] },
      { duration: 420, easing: "ease-in-out", pseudoElement: "::view-transition-new(root)" }
    );
  }

  return (
    // "light" (the app's own --c-* token override, from globals.css) is
    // added alongside "mkt"/"dark" (the marketing page's own --mkt-* scoped
    // tokens) so components reused from the app's design system — like
    // ArchitectureFlow below — stay theme-reactive too, without needing
    // their own --mkt-* rewrite or risking their /app usage elsewhere.
    // animate-converge fades/rises the whole page in on mount (same
    // keyframe scroll reveals already use) so arriving here from /app
    // reads as a soft entrance instead of an abrupt cut — client-side nav
    // between the two routes unmounts/mounts each page tree with no
    // transition otherwise.
    <div className={`mkt relative ${theme === "dark" ? "dark" : "light"} min-h-screen ${motionOn ? "animate-converge" : ""}`}>
      <AmbientGradient sageVar="--mkt-sage" sageSoftVar="--mkt-sage-soft" amberVar="--mkt-amber" />
      {/* Same canvas-based particle background /app uses — reused directly
          (not rebuilt) so density/speed/motion-off/reduced-motion behavior
          stays identical and the two pages can't drift apart again. */}
      <ParticleField paused={!motionOn} />
      <div className="relative z-10">
      <header className="relative isolate overflow-visible py-16 sm:py-24">
        {/* clip the video/vignette to the hero's own box without clipping
            the phone mockup below, which is allowed to bleed past this
            boundary — see the separately-positioned phone wrapper further
            down. */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <HeroVideo motionOn={motionOn} />
        </div>

        {/* Floating translucent pill, not a solid edge-to-edge bar — sits
            directly over the video (not sticky/fixed) so it scrolls away
            with the rest of the hero, matching the reference. Text is
            fixed-light (not theme-reactive) since this nav only ever
            renders on top of the video, never the page's own cream/dark
            surface — a text-shadow adds contrast insurance against
            whatever the lightest/darkest points of the footage are doing
            underneath the blur. */}
        <nav
          className="relative z-30 mx-auto mt-2 flex max-w-3xl items-center justify-between gap-4 rounded-full border px-6 py-3 backdrop-blur-md sm:mt-4"
          style={{ background: "rgba(255,255,255,0.12)", borderColor: "rgba(255,255,255,0.15)" }}
        >
          <div
            className="flex items-center gap-2 text-base font-semibold"
            style={{ color: "rgb(var(--mkt-fixed-light))", textShadow: "0 1px 4px rgba(0,0,0,0.35)" }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="16" cy="10" r="2.3" fill="currentColor" />
              <circle cx="3" cy="3" r="1.3" fill="currentColor" opacity="0.5" />
              <circle cx="2" cy="11" r="1.3" fill="currentColor" opacity="0.5" />
              <circle cx="3" cy="17" r="1.3" fill="currentColor" opacity="0.5" />
              <line x1="3" y1="3" x2="16" y2="10" stroke="currentColor" strokeWidth="1" opacity="0.3" />
              <line x1="2" y1="11" x2="16" y2="10" stroke="currentColor" strokeWidth="1" opacity="0.3" />
              <line x1="3" y1="17" x2="16" y2="10" stroke="currentColor" strokeWidth="1" opacity="0.3" />
            </svg>
            Relay
          </div>
          <div
            className="hidden items-center gap-8 text-sm md:flex"
            style={{ color: "rgb(var(--mkt-fixed-light) / 0.85)", textShadow: "0 1px 4px rgba(0,0,0,0.35)" }}
          >
            <a href="#how" className="hover:opacity-100">How it works</a>
            <Link href="/app?mode=demo" className="hover:opacity-100">Try the demo</Link>
            <a href="#faq" className="hover:opacity-100">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            {/* Mobile only — md:flex above already gives desktop a full
                text nav, so the compact menu would just duplicate it there.
                Below md this is the only way to reach How it works/FAQ. */}
            <div className="md:hidden">
              <NavMenu
                page="marketing"
                colors={{
                  ink: "rgb(var(--mkt-ink))",
                  muted: "rgb(var(--mkt-muted))",
                  line: "rgb(var(--mkt-line))",
                  card: "rgb(var(--mkt-card))",
                  accent: "rgb(var(--mkt-sage))",
                }}
                buttonColors={{ icon: "rgb(var(--mkt-fixed-light))", border: "rgba(255,255,255,0.4)" }}
              />
            </div>
            <button
              ref={themeToggleRef}
              onClick={handleThemeToggle}
              aria-label="Toggle dark mode"
              className="flex h-8 w-8 items-center justify-center rounded-full border transition hover:-translate-y-px"
              style={{ borderColor: "rgba(255,255,255,0.4)", color: "rgb(var(--mkt-fixed-light))" }}
            >
              {theme === "dark" ? "☾" : "☀"}
            </button>
            <Link
              href="/app"
              className="rounded px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
              style={{ background: "rgb(var(--mkt-sage))" }}
            >
              Open the app
            </Link>
          </div>
        </nav>

        {/* Fixed light text (--mkt-fixed-light), not the theme-reactive
            --mkt-ink/--mkt-muted used everywhere else on this page — those
            flip to near-black in light mode, which would go invisible
            against the video's dark vignette. The hero now always needs
            light text regardless of the page's own light/dark toggle,
            since it's sitting on a photo/video background, not the page's
            own cream/dark surface. */}
        <div className="relative z-20 mx-auto grid max-w-6xl items-center gap-12 px-6 md:grid-cols-[1.1fr_1fr]">
          <div>
            <Reveal>
              <h1 className="font-display text-4xl font-medium leading-tight tracking-tight sm:text-5xl" style={{ color: "rgb(var(--mkt-fixed-light))" }}>
                Money that moves
                <br />
                the way you <span className="mkt-accent">speak</span>.
              </h1>
            </Reveal>
            <Reveal className="mt-5">
              <p className="max-w-md text-lg" style={{ color: "rgb(var(--mkt-fixed-light) / 0.8)" }}>
                Type a sentence — &ldquo;send 5 USDC to sarah.eth&rdquo; — and Relay finds your funds, covers the network fee, and sends. No chain picker, no gas quote, no seed phrase.
              </p>
            </Reveal>
            <Reveal className="mt-8">
              <div className="flex items-center gap-6">
                <Link
                  href="/app"
                  className="inline-block rounded px-5 py-2.5 text-sm font-medium text-white transition hover:-translate-y-px hover:opacity-90"
                  style={{ background: "rgb(var(--mkt-sage))" }}
                >
                  Open the app
                </Link>
                <a
                  href="https://youtu.be/Lsi5LygN5V0"
                  target="_blank"
                  rel="noreferrer"
                  className="border-b pb-0.5 text-sm"
                  style={{ borderColor: "rgb(var(--mkt-fixed-light) / 0.4)", color: "rgb(var(--mkt-fixed-light) / 0.8)" }}
                >
                  Watch the demo · 90s
                </a>
              </div>
            </Reveal>
          </div>
          <Reveal className="min-w-0">
            <PhoneMock motionOn={motionOn} />
          </Reveal>
        </div>
      </header>

      <TxTicker />

      <div className="border-y" style={{ borderColor: "rgb(var(--mkt-line))" }}>
        <div className="mx-auto max-w-6xl px-6 py-9">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {STRIP.map((s) => (
              <Reveal key={s.h}>
                <h4 className="mb-1 text-sm font-semibold" style={{ color: "rgb(var(--mkt-ink))" }}>
                  {s.h}
                </h4>
                <p className="text-sm" style={{ color: "rgb(var(--mkt-muted))" }}>
                  {s.p}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </div>

      <section id="how" className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <QuoteCarousel motionOn={motionOn} />
        </div>
      </section>

      <section id="proof" className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal>
            <TrustPanel motionOn={motionOn} />
          </Reveal>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal className="mb-12 max-w-xl">
            <p className="mb-3 font-mono text-xs uppercase tracking-widest" style={{ color: "rgb(var(--mkt-muted2))" }}>
              From a sentence to a settled send
            </p>
            <h2 className="font-display text-3xl font-medium tracking-tight" style={{ color: "rgb(var(--mkt-ink))" }}>
              Three steps, <span className="mkt-accent">invisible</span> to you.
            </h2>
          </Reveal>
          <div className="grid gap-10 md:grid-cols-3">
            {STEPS.map((s) => (
              <Reveal key={s.n}>
                <p className="mb-3 font-mono text-sm" style={{ color: "rgb(var(--mkt-sage))" }}>
                  {s.n}
                </p>
                <h3 className="mb-2 text-lg font-medium" style={{ color: "rgb(var(--mkt-ink))" }}>
                  {s.h}
                </h3>
                <p className="text-sm" style={{ color: "rgb(var(--mkt-muted))" }}>
                  {s.p}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal className="mx-auto mb-10 max-w-md text-center">
            <p className="mb-2 font-mono text-xs uppercase tracking-widest" style={{ color: "rgb(var(--mkt-muted2))" }}>
              The full path
            </p>
            <h2 className="mb-2 font-display text-2xl font-medium tracking-tight sm:text-3xl" style={{ color: "rgb(var(--mkt-ink))" }}>
              Five steps, <span className="mkt-accent">invisible</span> to you.
            </h2>
            <p className="text-sm" style={{ color: "rgb(var(--mkt-muted))" }}>
              Every one of these happens in under two seconds — you only see the first and the last.
            </p>
          </Reveal>
          <Reveal>
            <ArchitectureFlow motionOn={motionOn} />
          </Reveal>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal className="mb-12 max-w-xl">
            <p className="mb-3 font-mono text-xs uppercase tracking-widest" style={{ color: "rgb(var(--mkt-muted2))" }}>
              Built for your first send, and your hundredth
            </p>
            <h2 className="font-display text-3xl font-medium tracking-tight" style={{ color: "rgb(var(--mkt-ink))" }}>
              Nothing to <span className="mkt-accent">learn</span>, everything to check.
            </h2>
          </Reveal>
          <Reveal className="overflow-hidden rounded-xl" style={{ border: "1px solid rgb(var(--mkt-line))" }}>
            <div className="grid gap-px sm:grid-cols-2" style={{ background: "rgb(var(--mkt-line))" }}>
              {FEATURE_CARDS.map((f) => (
                <div key={f.h} className="p-8 transition-transform hover:-translate-y-1" style={{ background: "rgb(var(--mkt-card))" }}>
                  <h3 className="mb-2 text-lg font-medium" style={{ color: "rgb(var(--mkt-ink))" }}>
                    {f.h}
                  </h3>
                  <p className="text-sm" style={{ color: "rgb(var(--mkt-muted))" }}>
                    {f.p}
                  </p>
                  {f.hashes && (
                    <div className="mt-4 flex flex-col gap-1.5 font-mono text-xs" style={{ color: "rgb(var(--mkt-muted2))" }}>
                      {f.hashes.map((h) => (
                        <span key={h}>{h}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section id="faq" className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal className="mb-12 max-w-xl">
            <p className="mb-3 font-mono text-xs uppercase tracking-widest" style={{ color: "rgb(var(--mkt-muted2))" }}>
              Questions you&apos;d actually ask
            </p>
            <h2 className="font-display text-3xl font-medium tracking-tight" style={{ color: "rgb(var(--mkt-ink))" }}>
              Straight answers, plainly put.
            </h2>
          </Reveal>
          <Reveal>
            <FaqAccordion />
          </Reveal>
        </div>
      </section>

      <section className="py-24 text-center">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal>
            <h2 className="mb-8 font-display text-3xl font-medium tracking-tight sm:text-4xl" style={{ color: "rgb(var(--mkt-ink))" }}>
              Your first send is one sentence away.
            </h2>
            <div className="flex justify-center gap-6">
              <Link
                href="/app"
                className="rounded px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
                style={{ background: "rgb(var(--mkt-sage))" }}
              >
                Open the app
              </Link>
              <a href="#how" className="border-b pb-0.5 text-sm" style={{ borderColor: "rgb(var(--mkt-line))", color: "rgb(var(--mkt-muted))" }}>
                How it works
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      <footer className="border-t py-14" style={{ borderColor: "rgb(var(--mkt-line))" }}>
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-8 sm:grid-cols-4">
            <div>
              <div className="mb-3 flex items-center gap-2 font-semibold" style={{ color: "rgb(var(--mkt-ink))" }}>
                Relay
              </div>
              <p className="max-w-xs text-sm" style={{ color: "rgb(var(--mkt-muted))" }}>
                Money that moves the way you speak. Real transfers, sponsored gas, checkable on-chain.
              </p>
            </div>
            <div>
              <h5 className="mb-3 text-xs uppercase tracking-wide" style={{ color: "rgb(var(--mkt-muted2))" }}>
                Product
              </h5>
              <div className="flex flex-col gap-2 text-sm" style={{ color: "rgb(var(--mkt-muted))" }}>
                <a href="#how">How it works</a>
                <a href="#proof">Live proof</a>
                <Link href="/app">Open the app</Link>
                <Link href="/app?mode=demo">Try the demo</Link>
              </div>
            </div>
            <div>
              <h5 className="mb-3 text-xs uppercase tracking-wide" style={{ color: "rgb(var(--mkt-muted2))" }}>
                Learn
              </h5>
              <div className="flex flex-col gap-2 text-sm" style={{ color: "rgb(var(--mkt-muted))" }}>
                <a href="https://arbiscan.io/address/0x8DD23aBBA62f10306805F0B2C8bF8459d1C3974e" target="_blank" rel="noreferrer">
                  Verified contract
                </a>
              </div>
            </div>
            <div>
              <h5 className="mb-3 text-xs uppercase tracking-wide" style={{ color: "rgb(var(--mkt-muted2))" }}>
                Connect
              </h5>
              <div className="flex flex-col gap-2 text-sm" style={{ color: "rgb(var(--mkt-muted))" }}>
                <a href="https://x.com/Daveilorah" target="_blank" rel="noreferrer">@Daveilorah on X</a>
                <span className="font-mono text-xs">Built with Particle · Magic · ZeroDev — settled on Arbitrum</span>
              </div>
            </div>
          </div>
          <div
            className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t pt-6 text-xs"
            style={{ borderColor: "rgb(var(--mkt-line))", color: "rgb(var(--mkt-muted2))" }}
          >
            <span>© 2026 Relay. Sends are real; demo mode is always labeled.</span>
            <span className="font-mono">Policy verified on Arbitrum Sepolia — settlement proven on Arbitrum One mainnet.</span>
          </div>
        </div>
      </footer>
      </div>
    </div>
  );
}
