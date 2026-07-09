"use client";
// components/PaymentReceipt.tsx
// The "verified" stamp — checkmark and hash fade/scale in ~300-450ms after
// the quote appears, like a real confirmation landing. Reinforces "verified"
// through motion and typography, never color decoration.
//
// Reads from the same relay:realHistory data TransactionTicker uses (newest
// entry first — see the unshift in app/page.tsx's handleExecute) so the
// receipt shows the most recent real send instead of staying frozen on one
// fixed transaction, the same way the ticker already does.

import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";
import type { RealTick } from "./TransactionTicker";

// Permanent fallback proof for a fresh session with no real send yet — a
// genuinely real, independently-verifiable transaction (not a placeholder),
// kept so the section never shows synthetic/fabricated data even before a
// user has completed their own send.
const FALLBACK_TX = {
  amount: "0.0002",
  token: "ETH",
  recipient: "Relay · Arbitrum One mainnet",
  txHash: "0x118ff441…f80dcfe",
  explorerUrl: "https://arbiscan.io/tx/0x118ff441d1bb070c000b74a940ebc3637dfd3d989781321bd8ec47b22f80dcfe",
};

function shortenHash(h: string): string {
  return h.length <= 20 ? h : `${h.slice(0, 10)}…${h.slice(-7)}`;
}

function shortenAddr(a: string): string {
  return a.length <= 12 ? a : `${a.slice(0, 6)}…${a.slice(-4)}`;
}

export default function PaymentReceipt({ realHistory = [] }: { realHistory?: RealTick[] }) {
  const latest = realHistory[0];

  const quote = latest
    ? `Verified send — Relay's wallet delegated via EIP-7702 sent ${latest.amount} ${latest.token} on Arbitrum One mainnet. Confirmed independently on Arbiscan.`
    : "Verified test transaction — Relay's wallet delegated via EIP-7702 and sent 0.0002 ETH on Arbitrum One mainnet. Confirmed independently on Arbiscan.";
  const who = latest ? `Relay · sent to ${shortenAddr(latest.recipient)}` : FALLBACK_TX.recipient;
  const hash = latest ? shortenHash(latest.txHash) : FALLBACK_TX.txHash;
  const hashLink = latest?.explorerUrl ?? FALLBACK_TX.explorerUrl;

  const ref = useRef<HTMLDivElement>(null);
  const [stamped, setStamped] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let timer: ReturnType<typeof setTimeout>;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          timer = setTimeout(() => setStamped(true), 300);
          observer.unobserve(el);
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => { observer.disconnect(); clearTimeout(timer); };
  }, []);

  return (
    <div
      ref={ref}
      className="max-w-lg rounded-2xl border border-line bg-slate p-6 transition-all hover:-translate-y-0.5 hover:border-line2"
    >
      <div className="mb-4 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-widest text-dim">
          Real transaction · confirmed
        </span>
        <span
          className={`flex items-center gap-1 font-mono text-[10px] text-check transition-all duration-500 ${
            stamped ? "scale-100 opacity-100" : "scale-90 opacity-0"
          }`}
        >
          <Icon name="check" className="text-[14px] align-middle" /> verified
        </span>
      </div>
      <p className="mb-4 font-display text-lg italic leading-relaxed text-chalk">
        &ldquo;{quote}&rdquo;
      </p>
      <div className="flex items-center justify-between gap-3 border-t border-line pt-4">
        <span className="text-sm font-medium text-chalk">{who}</span>
        {hashLink ? (
          <a
            href={hashLink}
            target="_blank"
            rel="noreferrer"
            className={`flex shrink-0 items-center gap-0.5 font-mono text-[10px] text-dim underline transition-opacity duration-500 delay-150 hover:text-check ${
              stamped ? "opacity-100" : "opacity-0"
            }`}
          >
            {hash} <Icon name="open_in_new" className="text-[13px] align-middle no-underline" />
          </a>
        ) : (
          <span
            className={`shrink-0 font-mono text-[10px] text-dim transition-opacity duration-500 delay-150 ${
              stamped ? "opacity-100" : "opacity-0"
            }`}
          >
            {hash}
          </span>
        )}
      </div>
    </div>
  );
}
