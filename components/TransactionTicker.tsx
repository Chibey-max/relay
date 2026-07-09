"use client";
// components/TransactionTicker.tsx
// A slow auto-scrolling strip of past sends — a "proof of life" pattern that
// makes the product feel active rather than static. Demo mode uses seeded
// data (clearly not claimed as real). Real entries from this session's own
// completed live sends are prepended and visually distinguished — Rule 3:
// never conflate synthetic and real data.

import Icon from "./Icon";

export interface RealTick {
  amount: string;
  token: string;
  recipient: string;
  txHash: string;
  timestamp: number;
  explorerUrl?: string;
}

const DEMO_TICKS = [
  { amount: "12 USDC", to: "0x4a…f81c", note: "3 chains sourced" },
  { amount: "0.5 ETH", to: "sarah.eth", note: "gasless" },
  { amount: "40 USDC", to: "0x91…22b0", note: "Base + Optimism" },
  { amount: "8 USDT", to: "mike.eth", note: "gasless" },
  { amount: "2.1 ETH", to: "0x7c…de44", note: "2 chains sourced" },
  { amount: "15 USDC", to: "0xab…9f01", note: "gasless" },
];

function shorten(addr: string): string {
  return addr.length < 12 ? addr : `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export default function TransactionTicker({ realHistory = [] }: { realHistory?: RealTick[] }) {
  // Real entries always come first within each cycle, then the demo-seeded
  // ones — never interleaved in a way that could read as "this many real
  // sends happened," since most of the strip is still illustrative.
  const allItems = [
    ...realHistory.map((h) => ({
      amount: `${h.amount} ${h.token}`,
      to: shorten(h.recipient),
      note: "verified",
      real: true as const,
      href: h.explorerUrl,
    })),
    ...DEMO_TICKS.map((t) => ({ ...t, real: false as const, href: undefined })),
  ];
  const items = [...allItems, ...allItems]; // duplicated for seamless loop

  return (
    <div className="ticker-mask overflow-hidden border-y border-line">
      {/* Slower on narrow viewports — the same translateX(-50%) distance
          covers relatively more of a phone's visible window per second, so
          each item has less wall-clock time to actually be read. A longer
          duration below sm keeps items lingering long enough to register. */}
      <div className="flex w-max animate-[scroll-left_28s_linear_infinite] gap-5 whitespace-nowrap py-3 sm:animate-scroll-left sm:gap-9">
        {items.map((t, i) => {
          const Tag = t.href ? "a" : "div";
          return (
            <Tag
              key={i}
              {...(t.href ? { href: t.href, target: "_blank", rel: "noreferrer" } : {})}
              className={`flex items-center gap-2 font-mono text-[11px] ${t.real ? "text-mist hover:text-check" : "text-dim"}`}
            >
              {t.real ? (
                <Icon name="verified" className="text-check text-[13px] align-middle" />
              ) : (
                <span className="h-1 w-1 rounded-full bg-check" />
              )}
              <span className={`font-medium ${t.real ? "text-chalk" : "text-mist"}`}>{t.amount}</span>
              <span>→ {t.to}</span>
              {/* The trailing note is the least essential part of each item —
                  drop it below sm so what's left fits the "read one item at a
                  glance" budget of a narrow marquee. Real items keep their
                  "verified" note visible at every width — it's the whole
                  point of distinguishing them. */}
              <span className={`${t.real ? "text-check" : "hidden opacity-60 sm:inline"}`}>· {t.note}</span>
            </Tag>
          );
        })}
      </div>
    </div>
  );
}
