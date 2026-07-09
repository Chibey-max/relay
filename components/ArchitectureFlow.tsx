// components/ArchitectureFlow.tsx
// Left-to-right map of what actually happens between "you type a sentence"
// and "money lands." Reuses the wordmark's own node/line visual language
// (small dim nodes, thin low-opacity connecting strokes, a fuller node at
// each visible endpoint) instead of introducing a new diagram style —
// see the header logo's SVG in app/page.tsx for the same dot/line weights.

interface FlowNode {
  label: string;
  detail: string;
  endpoint?: boolean;
}

const NODES: FlowNode[] = [
  { label: "You type", detail: "“send 5 USDC to 0x…”", endpoint: true },
  { label: "Groq", detail: "parses the intent" },
  { label: "Magic", detail: "signs — no seed phrase" },
  { label: "Particle UA", detail: "unifies funds across chains, EIP-7702" },
  { label: "ZeroDev", detail: "sponsors the gas" },
  { label: "Arbitrum", detail: "settles", endpoint: true },
];

export default function ArchitectureFlow() {
  return (
    <div className="flex flex-col gap-10 sm:flex-row sm:items-start sm:gap-0">
      {NODES.map((n, i) => (
        <div key={n.label} className="contents">
          <div className="flex flex-col items-center text-center sm:min-w-0 sm:flex-1">
            <div className="flex h-3 items-center justify-center">
              <span
                className={`block shrink-0 rounded-full ${
                  n.endpoint ? "h-3 w-3 bg-chalk" : "h-1.5 w-1.5 bg-dim"
                }`}
              />
            </div>
            <p className="mt-3 font-mono text-[11px] uppercase tracking-widest text-chalk">
              {n.label}
            </p>
            <p className="mx-auto mt-1 max-w-[10rem] text-xs leading-relaxed text-mist">
              {n.detail}
            </p>
          </div>
          {i < NODES.length - 1 && (
            <div className="hidden h-3 shrink-0 items-center px-1 sm:flex sm:min-w-[2rem] sm:flex-1">
              <div className="h-px w-full bg-line/50" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
