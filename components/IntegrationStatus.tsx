"use client";
// components/IntegrationStatus.tsx
// Rule 5: map every feature to a prize track, visible IN the app.
// Reads like a spec sheet now — plain text and hairlines, no glow, no HUD.

import { RELAY_MODE, EXPLORER } from "../lib/config";

interface Props {
  contractAddress?: string;
  lastUserOp?: string;
  lastTx?: string;
  uaActive?: boolean;
  mode?: "demo" | "live";
}

const Dot = ({ on }: { on: boolean }) => (
  <span className={`inline-block h-1.5 w-1.5 rounded-full ${on ? "bg-check" : "bg-line2"}`} />
);

export default function IntegrationStatus({
  contractAddress,
  lastUserOp,
  lastTx,
  uaActive = true,
  mode,
}: Props) {
  const displayMode = mode ?? RELAY_MODE;
  const rows = [
    { label: "Particle UA", sub: "EIP-7702 mode", track: "Main · $2,500", on: uaActive },
    { label: "Magic", sub: "email login", track: "Bonus · $500", on: true },
    { label: "ZeroDev", sub: "gas sponsored + policy enforced", track: "supports Arbitrum bounty", on: true },
    { label: "Arbitrum", sub: "execution layer", track: "Bounty · $2,000", on: !!contractAddress },
  ];

  return (
    <aside className="w-full max-w-xs rounded-xl border border-line bg-slate p-4 transition-colors">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-widest text-dim">
          Integration status
        </span>
        <span
          className={`font-mono text-[9px] uppercase tracking-wider ${
            displayMode === "live" ? "text-check" : "text-mist"
          }`}
        >
          {displayMode}
        </span>
      </div>

      <ul className="space-y-2.5">
        {rows.map((r) => (
          <li key={r.label} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2">
              <Dot on={r.on} />
              <span className="text-sm text-chalk">{r.label}</span>
              <span className="text-xs text-dim">{r.sub}</span>
            </span>
            <span className="font-mono text-[9px] text-mist">{r.track}</span>
          </li>
        ))}
      </ul>

      <div className="mt-3 space-y-1 border-t border-line pt-3 font-mono text-[10px]">
        {contractAddress && (
          <a
            href={`${EXPLORER}/address/${contractAddress}`}
            target="_blank"
            rel="noreferrer"
            className="block truncate text-dim hover:text-check"
          >
            contract: {contractAddress.slice(0, 10)}…
          </a>
        )}
        {lastUserOp && <span className="block truncate text-dim">userOp: {lastUserOp.slice(0, 18)}…</span>}
        {lastTx && (
          <a
            href={`${EXPLORER}/tx/${lastTx}`}
            target="_blank"
            rel="noreferrer"
            className="block truncate text-dim hover:text-check"
          >
            tx: {lastTx}
          </a>
        )}
      </div>
    </aside>
  );
}
