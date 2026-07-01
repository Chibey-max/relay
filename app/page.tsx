"use client";
// app/page.tsx
// Relay — editorial monochrome. Type a sentence -> unified balance reveals ->
// confirm -> cross-chain routing narrated -> real result. Particle field,
// scroll reveals, and a transaction ticker layer on top without touching the
// core flow or API contracts.

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import ParticleField from "../components/ParticleField";
import IntegrationStatus from "../components/IntegrationStatus";
import UnifiedBalance from "../components/UnifiedBalance";
import ExecutionSteps, { type Step } from "../components/ExecutionSteps";
import TransactionTicker from "../components/TransactionTicker";
import PaymentReceipt from "../components/PaymentReceipt";
import { RELAY_MODE, RELAY_POLICY_ADDRESS } from "../lib/config";
import { useReveal } from "../lib/useReveal";
import type { ParsedIntent, UnifiedBalance as Balance, ExecutionResult } from "../lib/config";

// ssr:false keeps magic-sdk out of the SSR webpack bundle
const MagicLogin = dynamic(() => import("../components/MagicLogin"), { ssr: false });

type Phase = "login" | "input" | "parsed" | "executing" | "done";

const EXAMPLE = "send 5 USDC to 0x1234abcd5678ef901234abcd5678ef901234abcd";

export default function Home() {
  const [relayMode, setRelayModeState] = useState<"demo" | "live">(RELAY_MODE);
  const [phase, setPhase] = useState<Phase>(RELAY_MODE === "live" ? "login" : "input");

  // On mount, read localStorage and sync — avoids SSR/hydration mismatch
  useEffect(() => {
    const saved = localStorage.getItem("relayMode") as "demo" | "live" | null;
    if (saved && saved !== RELAY_MODE) {
      setRelayModeState(saved);
      setPhase(saved === "live" ? "login" : "input");
    }
  }, []);
  const [text, setText] = useState("");
  const [intent, setIntent] = useState<ParsedIntent | null>(null);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [motionOn, setMotionOn] = useState(true);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [ownerAddress, setOwnerAddress] = useState<string | null>(null);
  const [depositAddress, setDepositAddress] = useState<string | null>(null);

  function toggleMode() {
    const next = relayMode === "demo" ? "live" : "demo";
    localStorage.setItem("relayMode", next);
    setRelayModeState(next);
    // Reset flow when switching modes
    setText("");
    setIntent(null);
    setResult(null);
    setSteps([]);
    setError(null);
    setOwnerAddress(null);
    setDepositAddress(null);
    setPhase(next === "live" ? "login" : "input");
  }

  // Default motion off if the OS prefers reduced motion — but this is only
  // the STARTING value. The explicit toggle below always wins after that,
  // which is what makes it a real override instead of a suggestion.
  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) setMotionOn(false);
  }, []);

  const [copied, setCopied] = useState<"address" | "deposit" | null>(null);
  const themeToggleRef = useRef<HTMLButtonElement>(null);

  function copyToClipboard(text: string, key: "address" | "deposit") {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  async function handleThemeToggle() {
    const next = theme === "dark" ? "light" : "dark";
    // Use View Transitions API for the circle-wipe effect if available
    if (!document.startViewTransition || !themeToggleRef.current) {
      setTheme(next);
      return;
    }
    const btn = themeToggleRef.current;
    const { top, left, width, height } = btn.getBoundingClientRect();
    const cx = left + width / 2;
    const cy = top + height / 2;
    const endRadius = Math.hypot(
      Math.max(cx, window.innerWidth - cx),
      Math.max(cy, window.innerHeight - cy)
    );
    const transition = document.startViewTransition(() => { setTheme(next); });
    await transition.ready;
    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${cx}px ${cy}px)`,
          `circle(${endRadius}px at ${cx}px ${cy}px)`,
        ],
      },
      { duration: 420, easing: "ease-in-out", pseudoElement: "::view-transition-new(root)" }
    );
  }

  const heroReveal = useReveal<HTMLDivElement>();
  const tickerReveal = useReveal<HTMLDivElement>();
  const howReveal = useReveal<HTMLDivElement>();
  const receiptReveal = useReveal<HTMLDivElement>();
  const flowReveal = useReveal<HTMLDivElement>();
  const mainSectionRef = useRef<HTMLDivElement>(null);

  // Collapse the hero once user is past the landing state
  const heroCollapsed = relayMode === "live" && ownerAddress !== null;

  async function handleLoginSuccess(address: string) {
    setOwnerAddress(address);
    setPhase("input");
    setTimeout(() => mainSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    // Fetch ZeroDev Smart Routing Address in background
    try {
      const res = await fetch("/api/sra", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerAddress: address, mode: relayMode }),
      });
      const data = await res.json();
      if (data.smartRoutingAddress) setDepositAddress(data.smartRoutingAddress);
    } catch {
      // SRA is non-blocking — user can still send
    }
  }

  async function handleParse() {
    if (!text.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/parse-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const parsed: ParsedIntent = await res.json();
      setIntent(parsed);

      const balRes = await fetch("/api/balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerAddress, mode: relayMode }),
      });
      const balData = await balRes.json();
      if (balData.error) setError(balData.error);
      setBalance(balData.balance ?? null);
      setPhase("parsed");
    } catch {
      setError("Couldn't read that. Try rephrasing your request.");
    } finally {
      setBusy(false);
    }
  }

  async function handleExecute() {
    if (!intent) return;
    setPhase("executing");
    setBusy(true);

    const initial: Step[] = [
      { label: "Reading your request", state: "done", detail: `${intent.amount} ${intent.token} → ${shorten(intent.recipient)}` },
      { label: "Finding your funds across chains", state: "active" },
      { label: "Routing through your Universal Account", state: "idle" },
      { label: "Confirming on Arbitrum", state: "idle" },
    ];
    setSteps(initial);

    try {
      if (relayMode === "live" && ownerAddress) {
        // Validate via server, then sign client-side
        const validateRes = await fetch("/api/execute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ intent, ownerAddress, mode: relayMode }),
        });
        const validateData = await validateRes.json();

        await tick(600);
        setSteps((s) => mark(s, 1, "done", "unified across chains"));
        setSteps((s) => mark(s, 2, "active"));
        await tick(700);

        if (!validateData.ready) {
          setSteps((s) => mark(s, 2, "error", validateData.error));
          setError(validateData.error ?? "Validation failed.");
          setPhase("done");
          setBusy(false);
          return;
        }

        setSteps((s) => mark(s, 2, "done", "no bridging, no gas"));
        setSteps((s) => mark(s, 3, "active"));
        await tick(400);

        // Client-side: sign and broadcast via Universal Account
        const { getMagicSigner } = await import("../lib/magic");
        const { sendUnifiedTransfer } = await import("../lib/particle-ua");
        const signer = await getMagicSigner();
        const txResult = await sendUnifiedTransfer({
          signer,
          to: intent.recipient!,
          amount: intent.amount ?? "0",
          token: intent.token ?? "USDC",
          contractAddress: RELAY_POLICY_ADDRESS,
        });
        setSteps((s) => mark(s, 3, "done", txResult.userOpHash ?? txResult.txHash));
        setResult({ ...txResult, ok: txResult.ok ?? true });
        setPhase("done");
      } else {
        // Demo path — server handles everything
        const res = await fetch("/api/execute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ intent, mode: relayMode }),
        });
        const data = await res.json();

        await tick(600);
        setSteps((s) => mark(s, 1, "done", data.sourcedFrom ? "unified across chains" : undefined));
        setSteps((s) => mark(s, 2, "active"));
        await tick(700);
        setSteps((s) => mark(s, 2, "done", "no bridging, no gas"));
        setSteps((s) => mark(s, 3, "active"));
        await tick(700);

        if (data.ok || data.mode === "demo") {
          setSteps((s) => mark(s, 3, "done", data.transactionId));
          setResult(data);
          setPhase("done");
        } else {
          setSteps((s) => mark(s, 3, "error", data.error));
          setError(data.error ?? "Execution failed.");
          setPhase("done");
        }
      }
    } catch (err: any) {
      setError(err?.message ?? "Execution failed. Check your connection and try again.");
      setPhase("done");
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setPhase(relayMode === "live" && !ownerAddress ? "login" : "input");
    setText("");
    setIntent(null);
    setResult(null);
    setSteps([]);
    setError(null);
  }

  return (
    <main className={`relative overflow-hidden bg-ink transition-colors duration-300 ${motionOn ? "" : "motion-off"} ${theme === "light" ? "light" : ""}`}>
      <ParticleField paused={!motionOn} />

      <div className="relative z-10 mx-auto max-w-6xl px-6 pb-16">
        <header className="flex items-center justify-between border-b border-line py-5">
          <span className="font-display text-xl font-semibold tracking-tight text-chalk">
            Relay
          </span>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleMode}
              className={`rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-wider transition hover:opacity-80 ${
                relayMode === "live" ? "border-check text-check" : "border-line2 text-mist"
              }`}
              title={`Switch to ${relayMode === "live" ? "demo" : "live"} mode`}
            >
              {relayMode === "live" ? "live ⇄" : "demo ⇄"}
            </button>
            <button
              ref={themeToggleRef}
              onClick={handleThemeToggle}
              className="rounded-full border border-line px-3 py-1 font-mono text-[9px] uppercase tracking-wider text-mist hover:text-chalk"
            >
              {theme === "dark" ? "dark" : "light"}
            </button>
            <button
              onClick={() => setMotionOn((m) => !m)}
              className="font-mono text-[9px] uppercase tracking-wider text-dim hover:text-chalk"
              aria-label="Toggle motion"
            >
              {motionOn ? "motion" : "still"}
            </button>
          </div>
        </header>

        {!heroCollapsed && (
          <>
            <div ref={heroReveal.ref} className={`py-16 text-center ${heroReveal.className}`}>
              <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.2em] text-dim">
                Universal Accounts · EIP-7702 · Arbitrum
              </p>
              <h1 className="mx-auto mb-5 max-w-xl font-display text-4xl font-medium leading-tight tracking-tight text-chalk sm:text-5xl">
                Money that moves the way you <em className="font-normal italic">speak</em>.
              </h1>
              <p className="mx-auto mb-8 max-w-md text-mist">
                Relay reads a sentence, finds your funds across every chain, and sends — no gas, no bridging, no seed phrase.
              </p>
            </div>
            <div ref={tickerReveal.ref} className={tickerReveal.className}>
              <TransactionTicker />
            </div>
          </>
        )}

        <div ref={mainSectionRef} className="grid grid-cols-1 gap-8 pt-14 lg:grid-cols-[1fr_320px]">
          <section className="mx-auto w-full max-w-xl">
            {phase === "login" && (
              <div className="mb-6 rounded-2xl border border-line bg-slate p-6">
                <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-dim">Step 1 of 2</p>
                <h2 className="mb-1 font-display text-xl font-medium text-chalk">Connect your wallet</h2>
                <p className="mb-5 text-sm text-mist">
                  Magic creates a non-custodial EOA from your email — no seed phrase, no download.
                </p>
                <MagicLogin onLogin={handleLoginSuccess} />
              </div>
            )}

            {phase === "input" && (
              <div>
                {ownerAddress && (
                  <div className="mb-6 rounded-2xl border border-check/30 bg-slate p-5 space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-check animate-pulse" />
                      <p className="font-mono text-[10px] uppercase tracking-widest text-check">Wallet ready</p>
                    </div>

                    {/* Your address */}
                    <div>
                      <p className="mb-1 font-mono text-[9px] uppercase tracking-widest text-dim">Your address</p>
                      <div className="flex items-center gap-2 rounded-lg border border-line bg-ink px-3 py-2.5">
                        <p className="flex-1 break-all font-mono text-xs text-chalk leading-relaxed">{ownerAddress}</p>
                        <button
                          onClick={() => copyToClipboard(ownerAddress, "address")}
                          className="shrink-0 rounded border border-line px-2.5 py-1 font-mono text-[10px] text-mist transition hover:border-line2 hover:text-chalk"
                        >
                          {copied === "address" ? "✓ copied" : "copy"}
                        </button>
                      </div>
                    </div>

                    {/* Deposit / SRA address */}
                    <div>
                      <p className="mb-1 font-mono text-[9px] uppercase tracking-widest text-dim">
                        Deposit address {!depositAddress && <span className="opacity-50">(loading…)</span>}
                      </p>
                      {depositAddress ? (
                        <div className="flex items-center gap-2 rounded-lg border border-line bg-ink px-3 py-2.5">
                          <p className="flex-1 break-all font-mono text-xs text-mist leading-relaxed">{depositAddress}</p>
                          <button
                            onClick={() => copyToClipboard(depositAddress, "deposit")}
                            className="shrink-0 rounded border border-line px-2.5 py-1 font-mono text-[10px] text-mist transition hover:border-line2 hover:text-chalk"
                          >
                            {copied === "deposit" ? "✓ copied" : "copy"}
                          </button>
                        </div>
                      ) : (
                        <div className="h-10 rounded-lg border border-line bg-ink animate-pulse" />
                      )}
                    </div>

                    {/* Funding guide */}
                    <div className="rounded-lg border border-line bg-ink/60 p-3">
                      <p className="mb-2 font-mono text-[9px] uppercase tracking-widest text-dim">Fund your wallet</p>
                      <ol className="space-y-1 text-xs text-mist">
                        <li className="flex gap-2"><span className="shrink-0 text-dim">1.</span>Copy your address above</li>
                        <li className="flex gap-2"><span className="shrink-0 text-dim">2.</span>Send USDC or ETH on Base, Arbitrum, Optimism, or Polygon</li>
                        <li className="flex gap-2"><span className="shrink-0 text-dim">3.</span>Type your payment below — Relay finds the funds</li>
                      </ol>
                      <div className="mt-3 flex gap-3 border-t border-line pt-3">
                        <a href="https://faucet.circle.com" target="_blank" rel="noreferrer"
                          className="font-mono text-[9px] uppercase tracking-wider text-dim underline hover:text-check transition">
                          USDC faucet ↗
                        </a>
                        <a href="https://bridge.arbitrum.io" target="_blank" rel="noreferrer"
                          className="font-mono text-[9px] uppercase tracking-wider text-dim underline hover:text-check transition">
                          Arbitrum bridge ↗
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mb-8">
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={EXAMPLE}
                    rows={3}
                    className="w-full resize-none rounded-xl border border-line bg-slate p-4 font-mono text-sm text-chalk placeholder:text-dim focus:border-line2 focus:outline-none"
                  />
                  <div className="mt-3 flex items-center justify-between">
                    <button onClick={() => setText(EXAMPLE)} className="font-mono text-xs text-dim hover:text-chalk">
                      try an example
                    </button>
                    <button
                      onClick={handleParse}
                      disabled={busy || !text.trim()}
                      className="rounded-lg bg-chalk px-5 py-2.5 text-sm font-medium text-ink transition hover:opacity-90 disabled:opacity-40"
                    >
                      {busy ? "reading…" : "Send →"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {phase === "parsed" && intent && (
              <div className="space-y-6">
                <UnifiedBalance balance={balance} />

                <div className="rounded-2xl border border-line bg-slate p-6">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-dim">
                    Ready to send
                  </span>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="font-display text-2xl font-medium text-chalk">
                      {intent.amount} {intent.token}
                    </span>
                    <span className="text-dim">→</span>
                    <button
                      onClick={() => intent.recipient && copyToClipboard(intent.recipient, "deposit")}
                      className="font-mono text-sm text-mist hover:text-chalk transition"
                      title={intent.recipient ?? ""}
                    >
                      {shorten(intent.recipient)} {copied === "deposit" ? "✓" : "⎘"}
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-dim">
                    Gas sponsored · routed cross-chain · no seed phrase
                  </p>

                  {!intent.recipient && (
                    <p className="mt-3 rounded-lg border border-line2 bg-ink p-2 text-xs text-mist">
                      No recipient found. Add an address like 0x… and try again.
                    </p>
                  )}

                  <div className="mt-5 flex gap-3">
                    <button onClick={reset} className="rounded-lg border border-line px-4 py-2 text-sm text-mist hover:text-chalk">
                      back
                    </button>
                    <button
                      onClick={handleExecute}
                      disabled={!intent.recipient || intent.action !== "transfer"}
                      className="flex-1 rounded-lg bg-chalk px-5 py-2 text-sm font-medium text-ink transition hover:opacity-90 disabled:opacity-40"
                    >
                      Confirm & send
                    </button>
                  </div>
                </div>
              </div>
            )}

            {(phase === "executing" || phase === "done") && (
              <div className="space-y-6">
                <ExecutionSteps steps={steps} result={result} />

                {phase === "done" && result?.ok && (
                  <div className="animate-converge rounded-2xl border border-check/40 bg-slate p-6">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-check">
                      Payment sent
                    </span>
                    <p className="mt-2 text-sm text-chalk">
                      {intent?.amount} {intent?.token} delivered. The recipient never knew a chain was involved.
                    </p>
                    {result.explorerUrl && (
                      <div className="mt-3 flex items-center gap-3">
                        <a
                          href={result.explorerUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono text-xs text-check underline"
                        >
                          view transaction ↗
                        </a>
                        {(result.txHash ?? result.transactionId) && (
                          <button
                            onClick={() => copyToClipboard(result.txHash ?? result.transactionId ?? "", "address")}
                            className="font-mono text-[10px] text-dim hover:text-chalk transition"
                          >
                            {copied === "address" ? "copied ✓" : "copy tx id"}
                          </button>
                        )}
                      </div>
                    )}
                    {relayMode === "demo" && (
                      <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-dim">
                        demo result — switch to live mode for a real on-chain tx
                      </p>
                    )}
                    <button onClick={reset} className="mt-4 block rounded-lg border border-line px-4 py-2 text-sm text-mist hover:text-chalk">
                      send another
                    </button>
                  </div>
                )}

                {phase === "done" && error && (
                  <div className="rounded-2xl border border-line2 bg-slate p-6">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-mist">
                      Didn&apos;t go through
                    </span>
                    <p className="mt-2 text-sm text-chalk">{error}</p>
                    <button onClick={reset} className="mt-4 rounded-lg border border-line px-4 py-2 text-sm text-mist hover:text-chalk">
                      try again
                    </button>
                  </div>
                )}
              </div>
            )}

            {error && phase === "input" && <p className="mt-4 text-sm text-mist">{error}</p>}
          </section>

          <div ref={flowReveal.ref} className={`lg:pt-2 ${flowReveal.className}`}>
            <IntegrationStatus
              uaActive={phase !== "input" && phase !== "login"}
              mode={relayMode}
              lastTx={result?.txHash}
              lastUserOp={result?.userOpHash}
              contractAddress={RELAY_POLICY_ADDRESS}
              depositAddress={depositAddress ?? undefined}
            />
          </div>
        </div>

        <div ref={howReveal.ref} className={`mt-20 border-t border-line pt-14 ${howReveal.className}`}>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-dim">How it works</p>
          <h2 className="mb-2 max-w-md font-display text-2xl font-medium tracking-tight text-chalk">
            Three steps. One sentence.
          </h2>
          <p className="mb-8 max-w-md text-sm text-mist">
            Relay reads what you want, finds the money, and settles it — the chain work happens where you can&apos;t see it.
          </p>
          <div className="grid grid-cols-1 divide-y divide-line overflow-hidden rounded-xl border border-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {[
              { n: "01", h: "Speak", p: "Type what you want to send. No forms, no fields, no chain to pick.", tag: "parsed by Groq" },
              { n: "02", h: "Unify", p: "Your funds, wherever they sit, become one balance. No bridging required.", tag: "Particle UA · EIP-7702" },
              { n: "03", h: "Settle", p: "Gas sponsored, signature simple, funds delivered on Arbitrum.", tag: "ZeroDev · Magic · Arbitrum" },
            ].map((s) => (
              <div key={s.n} className="bg-slate p-6 transition-colors hover:bg-slate2">
                <p className="mb-3 font-mono text-[11px] text-dim">{s.n}</p>
                <h3 className="mb-2 font-display text-lg font-medium text-chalk">{s.h}</h3>
                <p className="text-sm text-mist">{s.p}</p>
                <p className="mt-3 border-t border-line pt-2.5 font-mono text-[9px] text-dim">{s.tag}</p>
              </div>
            ))}
          </div>
        </div>

        <div ref={receiptReveal.ref} className={`mt-16 border-t border-line pt-14 ${receiptReveal.className}`}>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-dim">A payment, verified</p>
          <h2 className="mb-2 max-w-md font-display text-2xl font-medium tracking-tight text-chalk">
            Every send, on the record.
          </h2>
          <p className="mb-8 max-w-md text-sm text-mist">
            Each payment settles on Arbitrum and is verifiable by anyone — the receipt, not a promise.
          </p>
          <PaymentReceipt
            quote="5 USDC to sarah.eth, sourced from Base and Arbitrum, delivered with zero gas paid by the sender."
            who="Relay · Arbitrum Sepolia"
            hash="0x4a9f…2c81"
          />
        </div>
      </div>
    </main>
  );
}

function shorten(addr: string | null): string {
  if (!addr) return "—";
  if (addr.length < 12) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}
function tick(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
function mark(steps: Step[], i: number, state: Step["state"], detail?: string): Step[] {
  return steps.map((s, idx) => (idx === i ? { ...s, state, detail: detail ?? s.detail } : s));
}
