"use client";
// components/marketing/FaqAccordion.tsx

import { useState } from "react";

const FAQS = [
  {
    q: "What exactly happens when I hit send?",
    a: "Relay reads your sentence, works out who and how much, finds where your funds already sit, and moves them — no chain picker, no gas step for you to fill in.",
  },
  {
    q: "Where does my money actually live?",
    a: "In a wallet only you control, created the moment you log in with your email. Relay never holds your funds.",
  },
  {
    q: "Do I need a seed phrase?",
    a: "No. You log in with email, and your wallet is created for you behind the scenes.",
  },
  {
    q: "What does this cost?",
    a: "Nothing extra right now — every network fee is sponsored while this is live.",
  },
  {
    q: "Is this really on-chain, or a demo?",
    a: "Both exist in the app, and each is clearly labeled. Two real sends are already public on Arbitrum — you can open them directly from this page.",
  },
  {
    q: "What if my funds aren't already on Arbitrum?",
    a: "Today, Relay settles from funds already unified onto Arbitrum. Sourcing directly from other chains in the same send is the next thing being built — nothing here claims that's live yet.",
  },
];

export default function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div>
      {FAQS.map((f, i) => {
        const isOpen = open === i;
        return (
          <div key={f.q} className="border-t last:border-b" style={{ borderColor: "rgb(var(--mkt-line))" }}>
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-center justify-between py-5 text-left text-base font-medium"
              style={{ color: "rgb(var(--mkt-ink))" }}
            >
              {f.q}
              <span
                className="font-mono transition-transform"
                style={{ color: "rgb(var(--mkt-muted2))", transform: isOpen ? "rotate(45deg)" : "none" }}
              >
                +
              </span>
            </button>
            <div
              className="overflow-hidden text-sm transition-all"
              style={{
                maxHeight: isOpen ? "12rem" : "0",
                paddingTop: isOpen ? "0" : "0",
                paddingBottom: isOpen ? "1.25rem" : "0",
                color: "rgb(var(--mkt-muted))",
              }}
            >
              {f.a}
            </div>
          </div>
        );
      })}
    </div>
  );
}
