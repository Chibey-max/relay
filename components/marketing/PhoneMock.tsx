"use client";
// components/marketing/PhoneMock.tsx
// Decorative hero phone mockup — agent identity -> compose -> processing ->
// success, looping. Ported from design-reference/relay-landing-v10 (1).html.
// Purely local animation state (useAgentPhoneLoop) — no SDK/API calls.

import { useAgentPhoneLoop } from "./useAgentPhoneLoop";
import { useRealSendCycle } from "./useRealSendCycle";

function Layer({
  active,
  children,
}: {
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`absolute inset-0 flex flex-col overflow-y-auto px-6 pb-5 pt-5 transition-all duration-400 ${
        active ? "pointer-events-auto opacity-100" : "pointer-events-none translate-y-2 opacity-0"
      }`}
      // "safe center" (not plain center): centers short content, but falls
      // back to top-alignment instead of clipping the top if a screen's
      // content ever grows taller than the phone's height — the same
      // scroll-safety the overflow-y-auto above is there for.
      style={{ background: "rgb(var(--mkt-card))", justifyContent: "safe center" }}
    >
      {children}
    </div>
  );
}

export default function PhoneMock({ motionOn }: { motionOn: boolean }) {
  const { screen, typedText, rowsShown, ctaShown, ctaPressed, procDone } = useAgentPhoneLoop(motionOn);

  const rows = [
    { label: "Recipient", value: "sarah.eth" },
    { label: "Amount", value: "5.00 USDC" },
    { label: "Network fee", value: "Sponsored", chip: true },
    { label: "Settling on", value: "Arbitrum" },
  ];

  return (
    <div className="flex min-w-0 justify-center">
      {/* Outer box reserves exactly the SCALED-DOWN footprint at each
          breakpoint (320 * the same 0.6/0.85/1 factors used below) so
          there's no leftover dead space around a visually-shrunk phone —
          the inner phone (next div) always renders at its native 320px
          design width and is scaled + centered to fill this box exactly. */}
      <div className="relative w-full max-w-[192px] sm:max-w-[272px] lg:max-w-[320px]" style={{ aspectRatio: "9 / 19.5" }}>
        <div
          // Fixed 320px design width, never responsive — only the transform
          // scales it, via --phone-scale, so nothing inside ever reflows or
          // collides at smaller sizes; it's the same layout at every size,
          // just visually bigger or smaller as one image.
          className="absolute left-1/2 top-1/2 w-[320px] rounded-[54px] p-3 [--phone-scale:0.6] sm:[--phone-scale:0.85] lg:[--phone-scale:1]"
          style={{
            aspectRatio: "9 / 19.5",
            background:
              "linear-gradient(160deg, rgb(var(--mkt-card)) 0%, rgb(var(--mkt-line)) 22%, rgb(var(--mkt-card)) 48%, rgb(var(--mkt-line)) 76%, rgb(var(--mkt-card)) 100%)",
            // The wide, soft drop shadow picks up a faint warm amber cast
            // (rather than plain neutral gray) since this phone sits near
            // the amber anchor of the page's ambient background gradient —
            // a small detail toward reading as "in" that light instead of
            // pasted on top of it.
            boxShadow:
              "0 40px 80px -20px rgba(0,0,0,0.45), 0 15px 30px -15px rgba(0,0,0,0.3), 0 60px 90px -35px rgb(var(--mkt-amber) / 0.18), inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -1px 1px rgba(0,0,0,0.25)",
            transform: "translate(-50%, -50%) scale(var(--phone-scale))",
          }}
        >
        {/* Side buttons — raised via their own tiny highlight/shadow gradient rather than a flat rectangle */}
        <div
          className="absolute -right-[2px] top-[26%] h-[62px] w-[3px] rounded-l-sm"
          style={{ background: "linear-gradient(90deg, rgb(var(--mkt-muted2)) 0%, rgb(var(--mkt-line)) 100%)", boxShadow: "1px 0 1px rgba(0,0,0,0.2)" }}
        />
        <div
          className="absolute -right-[2px] top-[42%] h-[36px] w-[3px] rounded-l-sm"
          style={{ background: "linear-gradient(90deg, rgb(var(--mkt-muted2)) 0%, rgb(var(--mkt-line)) 100%)", boxShadow: "1px 0 1px rgba(0,0,0,0.2)" }}
        />

        <div
          className="relative flex h-full flex-col overflow-hidden rounded-[42px]"
          style={{ background: "rgb(var(--mkt-card))" }}
        >
          <StatusBar />

          <div className="relative flex-1 overflow-hidden">
            <Layer active={screen === "agent"}>
              <AgentScreen />
            </Layer>
            <Layer active={screen === "compose"}>
              <ComposeScreen typedText={typedText} rowsShown={rowsShown} ctaShown={ctaShown} ctaPressed={ctaPressed} rows={rows} />
            </Layer>
            <Layer active={screen === "processing"}>
              <ProcessingScreen procDone={procDone} />
            </Layer>
            <Layer active={screen === "success"}>
              <SuccessScreen motionOn={motionOn} />
            </Layer>
          </div>

          {/* Screen glare — light hitting glass at an angle. pointer-events-none
              so it never intercepts clicks on real links underneath. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[42px]"
            style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 40%)" }}
          />
        </div>
        </div>
      </div>
    </div>
  );
}

// Grid (not flex + manual margins) so the dynamic island's center column
// stays mathematically centered regardless of how wide the status-icon
// group on the right ends up — the previous flex version left that group
// empty, which happened to center the island by accident.
function StatusBar() {
  return (
    <div
      className="grid h-[46px] shrink-0 grid-cols-[1fr_auto_1fr] items-center px-5"
      style={{ color: "rgb(var(--mkt-ink))" }}
    >
      <span className="font-mono text-[13px] font-medium">9:41</span>
      <div className="relative h-[22px] w-[76px] justify-self-center rounded-xl" style={{ background: "rgb(var(--mkt-fixed-dark))" }}>
        <span
          aria-hidden
          className="absolute right-2 top-1/2 h-[6px] w-[6px] -translate-y-1/2 rounded-full"
          style={{ background: "radial-gradient(circle at 35% 35%, #3f3f3f, #050505 70%)", boxShadow: "0 0 0 1px rgba(255,255,255,0.06)" }}
        />
      </div>
      <span className="flex items-center justify-end gap-[5px]">
        <svg width="16" height="11" viewBox="0 0 16 11" fill="none">
          <rect x="0" y="7" width="3" height="4" rx="0.6" fill="currentColor" />
          <rect x="4.5" y="5" width="3" height="6" rx="0.6" fill="currentColor" />
          <rect x="9" y="3" width="3" height="8" rx="0.6" fill="currentColor" />
          <rect x="13.5" y="0.5" width="3" height="10.5" rx="0.6" fill="currentColor" />
        </svg>
        <svg width="15" height="11" viewBox="0 0 15 11" fill="none">
          <path d="M1 4.2C4.8 0.8 10.2 0.8 14 4.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M3.3 6.8C5.9 4.5 9.1 4.5 11.7 6.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          <circle cx="7.5" cy="9.3" r="1.1" fill="currentColor" />
        </svg>
        <svg width="25" height="12" viewBox="0 0 25 12" fill="none">
          <rect x="0.75" y="0.75" width="20.5" height="10.5" rx="2.75" stroke="currentColor" strokeWidth="1" />
          <rect x="2.25" y="2.25" width="17.5" height="7.5" rx="1.5" fill="currentColor" />
          <rect x="22" y="4" width="2" height="4" rx="1" fill="currentColor" />
        </svg>
      </span>
    </div>
  );
}

function AgentScreen() {
  return (
    <div className="flex flex-col items-center gap-1 pb-10 text-center">
      <div
        className="mb-1 h-11 w-11 rounded-full"
        style={{ background: "radial-gradient(circle at 32% 28%, rgb(var(--mkt-sage-soft)) 0%, rgb(var(--mkt-sage)) 72%)" }}
      />
      <h4 className="font-display text-lg font-medium" style={{ color: "rgb(var(--mkt-ink))" }}>
        Relay
      </h4>
      <div className="-mt-1 text-xs" style={{ color: "rgb(var(--mkt-muted))" }}>
        your payment agent
      </div>
      <div
        className="mt-1 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium"
        style={{ background: "rgb(var(--mkt-sage-soft) / 0.35)", color: "rgb(var(--mkt-sage))" }}
      >
        Verified on Arbitrum
      </div>
      <div className="mt-0.5 font-mono text-[10px]" style={{ color: "rgb(var(--mkt-muted2))" }}>
        RelayPolicy.sol · 0x8DD2…c3974e ↗
      </div>

      <div
        className="mt-2 flex w-full rounded-xl border py-2.5"
        style={{ background: "rgb(var(--mkt-cream))", borderColor: "rgb(var(--mkt-line))" }}
      >
        {[
          { num: "2", lbl: "Real sends" },
          { num: "100%", lbl: "Gas sponsored", mid: true },
          { num: "0", lbl: "Seed phrases" },
        ].map((s, i) => (
          <div key={s.lbl} className={`flex-1 text-center ${i !== 2 ? "border-r" : ""}`} style={{ borderColor: "rgb(var(--mkt-line))" }}>
            <div className="text-sm font-semibold" style={{ color: s.mid ? "rgb(var(--mkt-sage))" : "rgb(var(--mkt-ink))" }}>
              {s.num}
            </div>
            <div className="mt-0.5 text-[9px] uppercase tracking-wide" style={{ color: "rgb(var(--mkt-muted2))" }}>
              {s.lbl}
            </div>
          </div>
        ))}
      </div>

      <div
        className="mt-1.5 flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left"
        style={{ background: "rgb(var(--mkt-sage))", color: "#fff" }}
      >
        <span className="font-medium text-[13px]">Send with Relay</span>
      </div>
      <div
        className="mt-1.5 flex w-full items-center gap-2.5 rounded-xl border px-3 py-2 text-left"
        style={{ background: "rgb(var(--mkt-cream))", borderColor: "rgb(var(--mkt-line))" }}
      >
        <span className="font-medium text-[13px]" style={{ color: "rgb(var(--mkt-ink))" }}>
          View real transactions
        </span>
      </div>

      <div
        className="mt-2.5 rounded-xl border px-3 py-2.5 text-left text-[11px] leading-snug"
        style={{ background: "rgb(var(--mkt-cream))", borderColor: "rgb(var(--mkt-line))", color: "rgb(var(--mkt-muted))" }}
      >
        I only move funds you approve. Every real send is signed and public — you don&apos;t have to take my word for it.
      </div>
    </div>
  );
}

function ComposeScreen({
  typedText,
  rowsShown,
  ctaShown,
  ctaPressed,
  rows,
}: {
  typedText: string;
  rowsShown: number;
  ctaShown: boolean;
  ctaPressed: boolean;
  rows: { label: string; value: string; chip?: boolean }[];
}) {
  return (
    <div>
      <div className="mb-2 text-xs" style={{ color: "rgb(var(--mkt-muted2))" }}>
        Say it
      </div>
      <div
        className="mb-4 flex min-h-[1.3em] items-center gap-2 rounded-lg border px-3.5 py-3 text-sm"
        style={{ background: "rgb(var(--mkt-cream))", borderColor: "rgb(var(--mkt-line))" }}
      >
        <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "rgb(var(--mkt-sage))" }} />
        <span style={{ color: "rgb(var(--mkt-ink))" }}>{typedText}</span>
        <span className="ml-px inline-block h-[1em] w-px animate-blink" style={{ background: "rgb(var(--mkt-ink))" }} />
      </div>
      <div className="mb-1 text-xs" style={{ color: "rgb(var(--mkt-muted2))" }}>
        Relay reads it as
      </div>
      {rows.map((row, i) => (
        <div
          key={row.label}
          className={`flex items-center justify-between border-t py-2.5 text-sm transition-all duration-300 ${i === 0 ? "border-transparent" : ""} ${
            i < rowsShown ? "translate-y-0 opacity-100" : "translate-y-1.5 opacity-0"
          }`}
          style={{ borderColor: i === 0 ? "transparent" : "rgb(var(--mkt-line))" }}
        >
          <span style={{ color: "rgb(var(--mkt-muted))" }}>{row.label}</span>
          {row.chip ? (
            <span
              className="rounded px-2 py-0.5 font-mono text-[11px]"
              style={{ background: "rgb(var(--mkt-sage-soft) / 0.4)", color: "rgb(var(--mkt-sage))" }}
            >
              {row.value}
            </span>
          ) : (
            <span style={{ color: "rgb(var(--mkt-ink))" }}>{row.value}</span>
          )}
        </div>
      ))}
      <div
        className={`mt-4 rounded-lg py-3 text-center text-sm font-medium transition-all duration-300 ${
          ctaShown ? "opacity-100" : "opacity-0"
        } ${ctaPressed ? "scale-95" : "scale-100"}`}
        style={{ background: "rgb(var(--mkt-sage))", color: "#fff" }}
      >
        Confirm send
      </div>
    </div>
  );
}

function ProcessingScreen({ procDone }: { procDone: number }) {
  const items = ["Confirming instruction", "Sponsoring the gas", "Settling on Arbitrum"];
  return (
    <div className="text-center">
      <div
        className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full"
        style={{ background: "rgb(var(--mkt-sage-soft) / 0.4)" }}
      >
        <div
          className="h-5.5 w-5.5 animate-spin rounded-full border-2 border-t-transparent"
          style={{ borderColor: "rgb(var(--mkt-sage))", borderTopColor: "transparent" }}
        />
      </div>
      <h4 className="mb-4 font-display text-base font-medium" style={{ color: "rgb(var(--mkt-ink))" }}>
        Sending your payment
      </h4>
      <div className="rounded-xl border px-4 py-1" style={{ background: "rgb(var(--mkt-cream))", borderColor: "rgb(var(--mkt-line))" }}>
        {items.map((item, i) => {
          const done = i < procDone;
          return (
            <div
              key={item}
              className={`flex items-center gap-2.5 py-2.5 text-sm transition-colors ${i !== items.length - 1 ? "border-b" : ""}`}
              style={{ borderColor: "rgb(var(--mkt-line))", color: done ? "rgb(var(--mkt-ink))" : "rgb(var(--mkt-muted2))" }}
            >
              <span
                className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border text-[10px]"
                style={{
                  borderColor: done ? "rgb(var(--mkt-sage))" : "rgb(var(--mkt-line))",
                  background: done ? "rgb(var(--mkt-sage))" : "transparent",
                  color: "#fff",
                }}
              >
                {done ? "✓" : ""}
              </span>
              {item}
            </div>
          );
        })}
      </div>
      <div className="mt-4 font-mono text-[11px]" style={{ color: "rgb(var(--mkt-muted2))" }}>
        Gas-free · signed on-chain
      </div>
    </div>
  );
}

function SuccessScreen({ motionOn }: { motionOn: boolean }) {
  const { idx, visible, current } = useRealSendCycle(motionOn);

  return (
    <div className="flex flex-col items-center text-center">
      <div
        key={idx}
        className="mb-4 flex h-14 w-14 animate-stamp items-center justify-center rounded-full"
        style={{ background: "rgb(var(--mkt-sage))" }}
      >
        <span className="text-2xl text-white">✓</span>
      </div>
      <div className={`w-full transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`}>
        <h4 className="font-display text-lg font-medium" style={{ color: "rgb(var(--mkt-ink))" }}>
          Sent.
        </h4>
        <p className="mb-4 text-sm" style={{ color: "rgb(var(--mkt-muted))" }}>
          {current.title}
        </p>
        <div className="w-full rounded-lg border p-3.5 text-left text-xs" style={{ background: "rgb(var(--mkt-cream))", borderColor: "rgb(var(--mkt-line))" }}>
          {[
            ["Network fee", "Sponsored"],
            ["Settled on", "Arbitrum"],
            ["Status", "Confirmed"],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between py-1" style={{ color: "rgb(var(--mkt-muted))" }}>
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
            className="mt-3 inline-block font-mono text-xs underline-offset-2 hover:underline"
            style={{ color: "rgb(var(--mkt-sage))" }}
          >
            {current.hash} ↗
          </a>
        ) : (
          <div className="mt-3 font-mono text-xs" style={{ color: "rgb(var(--mkt-sage))" }}>
            {current.hash} ↗
          </div>
        )}
      </div>
      <div className="mt-3 flex gap-1.5">
        {[0, 1].map((i) => (
          <span
            key={i}
            className="h-1 w-1 rounded-full transition-colors"
            style={{ background: i === idx ? "rgb(var(--mkt-sage))" : "rgb(var(--mkt-line))" }}
          />
        ))}
      </div>
    </div>
  );
}
