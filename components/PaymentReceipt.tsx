"use client";
// components/PaymentReceipt.tsx
// The "verified" stamp — checkmark and hash fade/scale in ~300-450ms after
// the quote appears, like a real confirmation landing. Reinforces "verified"
// through motion and typography, never color decoration.

import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";

export default function PaymentReceipt({
  quote,
  who,
  hash,
  hashLink,
}: {
  quote: string;
  who: string;
  hash: string;
  hashLink?: string;
}) {
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
