"use client";
// components/ArchitectureFlow.tsx
// A self-playing demo reel of the request lifecycle — no interaction
// required. Reuses the wordmark's own node/line visual language (small
// dim nodes, thin low-opacity connecting strokes) instead of a new
// diagram style, and the app's existing `stamp` keyframe for the
// activation pulse instead of introducing another animation.

import { useEffect, useState } from "react";

interface FlowNode {
  label: string;
  detail: string;
}

const NODES: FlowNode[] = [
  { label: "You type", detail: "“send 5 USDC to 0x…”" },
  { label: "Groq", detail: "parses the intent" },
  { label: "Magic", detail: "signs — no seed phrase" },
  { label: "Particle UA", detail: "unifies funds across chains, EIP-7702" },
  { label: "ZeroDev", detail: "sponsors the gas" },
  { label: "Arbitrum", detail: "settles" },
];

const ACTIVE_MS = 1000;
const END_HOLD_MS = 1500;
const RESTART_PAUSE_MS = 500;

type NodeState = "idle" | "active" | "done";

function stateFor(i: number, activeIndex: number): NodeState {
  if (activeIndex === -1) return "idle";
  if (i < activeIndex) return "done";
  if (i === activeIndex) return "active";
  return "idle";
}

export default function ArchitectureFlow({ motionOn = true }: { motionOn?: boolean }) {
  // -1 = reset pause (all idle), 0..NODES.length-1 = that node active,
  // NODES.length = past the last node — every node reads "done", which is
  // the fully-lit hold state before the loop resets.
  const [activeIndex, setActiveIndex] = useState(-1);
  const [cycleCount, setCycleCount] = useState(0);

  useEffect(() => {
    if (!motionOn) {
      // Reduced-motion / motion-off: show the complete picture at rest —
      // every node settled, every connector drawn — not a frozen
      // mid-animation and not an empty idle state.
      setActiveIndex(NODES.length);
      return;
    }

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    function step(i: number) {
      if (cancelled) return;
      setActiveIndex(i);
      if (i === 0) setCycleCount((c) => c + 1);
      const delay = i === NODES.length ? END_HOLD_MS : ACTIVE_MS;
      timeoutId = setTimeout(() => {
        if (cancelled) return;
        if (i === NODES.length) {
          setActiveIndex(-1);
          timeoutId = setTimeout(() => step(0), RESTART_PAUSE_MS);
        } else {
          step(i + 1);
        }
      }, delay);
    }
    step(0);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [motionOn]);

  return (
    <div className="flex flex-col gap-10 sm:flex-row sm:items-start sm:gap-0">
      {NODES.map((n, i) => {
        const state = stateFor(i, activeIndex);
        const drawn = activeIndex > i;
        return (
          <div key={n.label} className="contents">
            <div className="flex flex-col items-center text-center sm:min-w-0 sm:flex-1">
              <div className="flex h-3 items-center justify-center">
                <span
                  className={`block shrink-0 rounded-full transition-all duration-300 ${
                    state === "active"
                      ? "h-3 w-3 animate-stamp bg-chalk"
                      : state === "done"
                        ? "h-2 w-2 bg-chalk"
                        : "h-1.5 w-1.5 bg-dim"
                  }`}
                />
              </div>
              <p
                className={`mt-3 font-mono text-[11px] uppercase tracking-widest transition-colors duration-300 ${
                  state === "active" ? "font-semibold text-chalk" : state === "done" ? "text-mist" : "text-dim"
                }`}
              >
                {n.label}
              </p>
              <p
                key={i === 0 ? `type-${cycleCount}` : undefined}
                className={`mx-auto mt-1 max-w-[10rem] text-xs leading-relaxed transition-colors duration-300 ${
                  state === "idle" ? "text-dim" : "text-mist"
                } ${i === 0 && state === "active" ? "animate-typewriter" : ""}`}
              >
                {n.detail}
              </p>
            </div>
            {i < NODES.length - 1 && (
              <div className="hidden h-3 shrink-0 items-center px-1 sm:flex sm:min-w-[2rem] sm:flex-1">
                <div className="relative h-px w-full overflow-hidden">
                  <div className="absolute inset-0 bg-line/50" />
                  <div
                    className="absolute inset-0 origin-left bg-chalk transition-transform duration-500 ease-out"
                    style={{ transform: `scaleX(${drawn ? 1 : 0})` }}
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
