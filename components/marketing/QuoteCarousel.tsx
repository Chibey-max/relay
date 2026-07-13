"use client";
// components/marketing/QuoteCarousel.tsx
// Rotating example sentences with dot navigation + autoplay. Decorative
// copy only — no parsing actually happens here.

import { useEffect, useState } from "react";

const QUOTES = [
  { say: "send 5 USDC to sarah.eth", result: "Relay resolves the name, finds your funds, settles on Arbitrum" },
  { say: "pay alex 20 for lunch", result: "Relay matches your contact, sends, gas covered" },
  { say: "move 50 to my savings wallet", result: "Relay sends between your own wallets, no extra steps" },
  { say: "split rent, 300 to landlord.eth", result: "Relay parses the amount and recipient, confirms before sending" },
];

export default function QuoteCarousel({ motionOn }: { motionOn: boolean }) {
  const [qi, setQi] = useState(0);

  useEffect(() => {
    if (!motionOn) return;
    const id = setInterval(() => setQi((i) => (i + 1) % QUOTES.length), 4200);
    return () => clearInterval(id);
  }, [motionOn]);

  const q = QUOTES[qi];

  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="mb-4 font-mono text-sm" style={{ color: "rgb(var(--mkt-muted))" }}>
        You could just say
      </p>
      <p
        key={qi}
        className="mkt-in flex min-h-[4em] items-center justify-center font-display text-3xl italic leading-tight transition-opacity duration-200 sm:text-4xl"
        style={{ color: "rgb(var(--mkt-ink))" }}
      >
        &ldquo;{q.say}&rdquo;
      </p>
      <div
        className="mt-6 inline-flex items-center gap-2 rounded-full border py-2 pl-2 pr-4 text-sm"
        style={{ background: "rgb(var(--mkt-card))", borderColor: "rgb(var(--mkt-line))" }}
      >
        <span
          className="flex h-6 w-6 items-center justify-center rounded-full"
          style={{ background: "rgb(var(--mkt-sage-soft))" }}
        >
          ↗
        </span>
        <span style={{ color: "rgb(var(--mkt-ink))" }}>
          <b className="font-semibold">Relay resolves</b> {q.result.replace(/^Relay \S+ /, "")}
        </span>
      </div>
      <div className="mt-8 flex items-center justify-center gap-2">
        {QUOTES.map((_, i) => (
          <button
            key={i}
            onClick={() => setQi(i)}
            aria-label={`Show example ${i + 1}`}
            className="h-1.5 rounded-full transition-all"
            style={{
              width: i === qi ? "20px" : "7px",
              background: i === qi ? "rgb(var(--mkt-sage))" : "rgb(var(--mkt-line))",
            }}
          />
        ))}
      </div>
    </div>
  );
}
