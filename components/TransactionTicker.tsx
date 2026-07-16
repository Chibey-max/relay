"use client";
// components/TransactionTicker.tsx
/**
 * A slow auto-scrolling strip of past sends: a "proof of life" pattern
 * that makes the product feel active rather than static. Every entry is
 * a real send, either this session's own just-completed ones
 * (realHistory, shown first) or live-fetched Relay wallet history from
 * app/api/real-sends/route.ts (see lib/useRealSends.ts), deduplicated
 * against realHistory by hash so a just-completed send never appears
 * twice. Falls back to the two known-real, hardcoded transactions in
 * lib/realSends.ts if the live fetch is empty, loading, or fails.
 */

import Icon from "./Icon";
import { useRealSends } from "../lib/useRealSends";
import { REAL_SENDS } from "../lib/realSends";

export interface RealTick {
  amount: string;
  token: string;
  recipient: string;
  txHash: string;
  timestamp: number;
  explorerUrl?: string;
}

interface TickItem {
  amount: string;
  to: string;
  note: string;
  href?: string;
}

function shorten(addr: string): string {
  return addr.length < 12 ? addr : `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

const FALLBACK_TICKS: TickItem[] = REAL_SENDS.map((s) => {
  const toMatch = s.title.match(/to (.+)$/);
  return {
    amount: s.title.split(toMatch ? " to " : " · ")[0],
    to: toMatch ? toMatch[1] : s.hash,
    note: "verified",
    href: s.href,
  };
});

export default function TransactionTicker({
  realHistory = [],
}: {
  realHistory?: RealTick[];
}) {
  const { sends } = useRealSends();

  const sessionHashes = new Set(realHistory.map((h) => h.txHash));
  const liveTicks: TickItem[] = sends
    .filter((s) => !sessionHashes.has(s.hash))
    .map((s) => ({
      amount: `${s.valueEth} ETH`,
      to: shorten(s.to),
      note: "verified",
      href: `https://arbiscan.io/tx/${s.hash}`,
    }));

  const sessionTicks: TickItem[] = realHistory.map((h) => ({
    amount: `${h.amount} ${h.token}`,
    to: shorten(h.recipient),
    note: "verified",
    href: h.explorerUrl,
  }));

  /**
   * Session's own just-completed sends always lead (most immediately
   * relevant to whoever is looking at it), then live-fetched history,
   * falling back to the hardcoded known-real pair only when there is
   * genuinely nothing else to show.
   */
  const allItems =
    sessionTicks.length > 0 || liveTicks.length > 0
      ? [...sessionTicks, ...liveTicks]
      : FALLBACK_TICKS;
  const items = [...allItems, ...allItems]; // duplicated for seamless loop

  return (
    <div className="ticker-mask overflow-hidden border-y border-line">
      {/* Slower on narrow viewports. The same translateX(-50%) distance
          covers relatively more of a phone's visible window per second, so
          each item has less wall-clock time to actually be read. A longer
          duration below sm keeps items lingering long enough to register. */}
      <div className="flex w-max animate-[scroll-left_28s_linear_infinite] gap-5 whitespace-nowrap py-3 sm:animate-scroll-left sm:gap-9">
        {items.map((t, i) => {
          const Tag = t.href ? "a" : "div";
          return (
            <Tag
              key={i}
              {...(t.href
                ? { href: t.href, target: "_blank", rel: "noreferrer" }
                : {})}
              className="flex items-center gap-2 font-mono text-[11px] text-mist hover:text-check"
            >
              <Icon
                name="verified"
                className="text-check text-[13px] align-middle"
              />
              <span className="font-medium text-chalk">{t.amount}</span>
              <span>→ {t.to}</span>
              <span className="text-check">· {t.note}</span>
            </Tag>
          );
        })}
      </div>
    </div>
  );
}
