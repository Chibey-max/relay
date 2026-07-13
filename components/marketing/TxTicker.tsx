// components/marketing/TxTicker.tsx
// Two-row opposite-direction marquee of example sends. Decorative content —
// these are illustrative amounts/recipients, not a claim of real sends
// (the real-proof tx hashes live in TrustPanel, kept separate deliberately).

const TICKS = [
  { to: "sarah.eth", amt: "5.00 USDC" },
  { to: "alex.eth", amt: "20.00 USDC" },
  { to: "landlord.eth", amt: "300.00 USDC" },
  { to: "0x829c…102e3", amt: "0.0002 ETH" },
  { to: "maria.eth", amt: "12.50 USDC" },
  { to: "savings.eth", amt: "50.00 USDC" },
];

function Chip({ to, amt }: { to: string; amt: string }) {
  return (
    <div
      className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-3.5 py-2 text-sm transition-transform hover:-translate-y-0.5"
      style={{ background: "rgb(var(--mkt-card))", borderColor: "rgb(var(--mkt-line))" }}
    >
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ background: "rgb(var(--mkt-sage))" }} />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: "rgb(var(--mkt-sage))" }} />
      </span>
      {/* Amount stays ink (not sage) — every chip here is illustrative, not
          a real send, and green on /app's equivalent ticker is reserved for
          genuinely real/verified entries, not applied to every item. */}
      <span className="font-mono" style={{ color: "rgb(var(--mkt-ink))" }}>
        {amt}
      </span>
      <span style={{ color: "rgb(var(--mkt-muted))" }}>→ {to}</span>
    </div>
  );
}

function Row({ items, reverse }: { items: typeof TICKS; reverse?: boolean }) {
  const doubled = [...items, ...items];
  return (
    <div className="mkt-ticker-mask mb-3 flex overflow-hidden">
      <div className={`flex shrink-0 gap-3 pr-3 ${reverse ? "animate-scroll-right" : "animate-scroll-left"}`}>
        {doubled.map((t, i) => (
          <Chip key={`${t.to}-${i}`} {...t} />
        ))}
      </div>
    </div>
  );
}

export default function TxTicker() {
  return (
    <div className="py-10">
      <p className="mb-6 text-center font-mono text-xs uppercase tracking-widest" style={{ color: "rgb(var(--mkt-muted2))" }}>
        Real sends, on the record
      </p>
      <Row items={TICKS} />
      <Row items={[...TICKS].reverse()} reverse />
    </div>
  );
}
