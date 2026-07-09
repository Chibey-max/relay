"use client";
// components/TransactionTicker.tsx
// A slow auto-scrolling strip of past sends — a "proof of life" pattern that
// makes the product feel active rather than static. Demo mode uses seeded
// data (clearly not claimed as real); live mode should be wired to a real
// feed of recent transactions once available.

const DEMO_TICKS = [
  { amount: "12 USDC", to: "0x4a…f81c", note: "3 chains sourced" },
  { amount: "0.5 ETH", to: "sarah.eth", note: "gasless" },
  { amount: "40 USDC", to: "0x91…22b0", note: "Base + Optimism" },
  { amount: "8 USDT", to: "mike.eth", note: "gasless" },
  { amount: "2.1 ETH", to: "0x7c…de44", note: "2 chains sourced" },
  { amount: "15 USDC", to: "0xab…9f01", note: "gasless" },
];

export default function TransactionTicker() {
  const items = [...DEMO_TICKS, ...DEMO_TICKS]; // duplicated for seamless loop

  return (
    <div className="ticker-mask overflow-hidden border-y border-line">
      {/* Slower on narrow viewports — the same translateX(-50%) distance
          covers relatively more of a phone's visible window per second, so
          each item has less wall-clock time to actually be read. A longer
          duration below sm keeps items lingering long enough to register. */}
      <div className="flex w-max animate-[scroll-left_28s_linear_infinite] gap-5 whitespace-nowrap py-3 sm:animate-scroll-left sm:gap-9">
        {items.map((t, i) => (
          <div key={i} className="flex items-center gap-2 font-mono text-[11px] text-dim">
            <span className="h-1 w-1 rounded-full bg-check" />
            <span className="font-medium text-mist">{t.amount}</span>
            <span>→ {t.to}</span>
            {/* The trailing note is the least essential part of each item —
                drop it below sm so what's left fits the "read one item at a
                glance" budget of a narrow marquee. */}
            <span className="hidden opacity-60 sm:inline">· {t.note}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
