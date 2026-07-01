"use client";
// components/PaymentReceipt.tsx
// The "verified" stamp — checkmark and hash fade/scale in ~300-450ms after
// the quote appears, like a real confirmation landing. Reinforces "verified"
// through motion and typography, never color decoration.

import { useEffect, useRef, useState } from "react";

export default function PaymentReceipt({
  quote,
  who,
  hash,
}: {
  quote: string;
  who: string;
  hash: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [stamped, setStamped] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const t = setTimeout(() => setStamped(true), 300);
          observer.unobserve(el);
          return () => clearTimeout(t);
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="max-w-lg rounded-2xl border border-line bg-slate p-6 transition-all hover:-translate-y-0.5 hover:border-line2"
    >
      <div className="mb-4 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-widest text-dim">
          Payment · confirmed
        </span>
        <span
          className={`flex items-center gap-1 font-mono text-[10px] text-check transition-all duration-500 ${
            stamped ? "scale-100 opacity-100" : "scale-90 opacity-0"
          }`}
        >
          ✓ verified
        </span>
      </div>
      <p className="mb-4 font-display text-lg italic leading-relaxed text-chalk">
        &ldquo;{quote}&rdquo;
      </p>
      <div className="flex items-center justify-between border-t border-line pt-4">
        <span className="text-sm font-medium text-chalk">{who}</span>
        <span
          className={`font-mono text-[10px] text-dim transition-opacity duration-500 delay-150 ${
            stamped ? "opacity-100" : "opacity-0"
          }`}
        >
          {hash}
        </span>
      </div>
    </div>
  );
}
