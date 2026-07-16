// components/marketing/TxTicker.tsx
// Two-row opposite-direction marquee of example sends. Decorative
// content: these are illustrative amounts and recipients, not a claim
// of real sends. The real, verified tx hashes live in TrustPanel, kept
// separate deliberately.

import Icon from "../Icon";

const TICKS = [
  { to: "sarah.eth", amt: "5.00 USDC" },
  { to: "alex.eth", amt: "20.00 USDC" },
  { to: "landlord.eth", amt: "300.00 USDC" },
  { to: "0x829c…102e3", amt: "0.0002 ETH" },
  { to: "maria.eth", amt: "12.50 USDC" },
  { to: "savings.eth", amt: "50.00 USDC" },
];

function Chip({
  to,
  amt,
  reverse,
}: {
  to: string;
  amt: string;
  reverse?: boolean;
}) {
  // Arrow direction matches this row's own scroll direction (arrow_back
  // on the reversed, rightward-scrolling row, arrow_forward on the
  // other) instead of a static arrow pointing the same way regardless
  // of motion.
  return (
    <div className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-mkt-line bg-mkt-card px-3.5 py-2 text-sm transition-transform hover:-translate-y-0.5">
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mkt-sage opacity-60" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-mkt-sage" />
      </span>
      {/* Amount stays ink, not sage. Every chip here is illustrative, not a real send, and green on /app's equivalent ticker is reserved for genuinely real, verified entries, not applied to every item. */}
      <span className="font-mono text-mkt-ink">{amt}</span>
      <span className="flex items-center gap-1 text-mkt-muted">
        <Icon
          name={reverse ? "arrow_back" : "arrow_forward"}
          className="shrink-0 text-[13px] align-middle"
        />
        {to}
      </span>
    </div>
  );
}

function Row({ items, reverse }: { items: typeof TICKS; reverse?: boolean }) {
  const doubled = [...items, ...items];
  return (
    <div className="mkt-ticker-mask flex overflow-hidden" aria-hidden="true">
      <div
        className={`flex shrink-0 gap-3 pr-3 ${reverse ? "animate-scroll-right" : "animate-scroll-left"}`}
      >
        {doubled.map((t, i) => (
          <Chip key={`${t.to}-${i}`} {...t} reverse={reverse} />
        ))}
      </div>
    </div>
  );
}

export default function TxTicker() {
  return (
    <div className="flex flex-col gap-6 py-10">
      <p className="text-center font-mono text-xs uppercase tracking-widest text-mkt-muted2">
        Example sends
      </p>
      {/* Decorative and duplicated for the seamless scroll illusion, hidden from assistive tech via aria-hidden on each Row above. */}
      <div className="flex flex-col gap-3">
        <Row items={TICKS} />
        <Row items={[...TICKS].reverse()} reverse />
      </div>
    </div>
  );
}
