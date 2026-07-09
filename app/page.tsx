"use client";
// app/page.tsx
// Relay — editorial monochrome. Type a sentence -> unified balance reveals ->
// confirm -> cross-chain routing narrated -> real result. Particle field,
// scroll reveals, and a transaction ticker layer on top without touching the
// core flow or API contracts.

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import ParticleField from "../components/ParticleField";
import CyclingWord from "../components/CyclingWord";
import AmbientOrb from "../components/AmbientOrb";
import IntegrationStatus from "../components/IntegrationStatus";
import UnifiedBalance from "../components/UnifiedBalance";
import ExecutionSteps, { type Step } from "../components/ExecutionSteps";
import TransactionTicker, { type RealTick } from "../components/TransactionTicker";
import PaymentReceipt from "../components/PaymentReceipt";
import Icon from "../components/Icon";
import { RELAY_MODE, RELAY_POLICY_ADDRESS, EXPLORER } from "../lib/config";
import { useReveal } from "../lib/useReveal";
import { useSessionPersist, clearRelaySession } from "../lib/useSessionPersist";
import type { ParsedIntent, UnifiedBalance as Balance, ExecutionResult } from "../lib/config";

// ssr:false keeps magic-sdk out of the SSR webpack bundle
const MagicLogin = dynamic(() => import("../components/MagicLogin"), { ssr: false });

type Phase = "login" | "input" | "parsed" | "executing" | "done";

const EXAMPLE = "send 5 USDC to 0x1234abcd5678ef901234abcd5678ef901234abcd";

export default function Home() {
  const [relayMode, setRelayModeState] = useState<"demo" | "live">(RELAY_MODE);
  const [phase, setPhase] = useSessionPersist<Phase>("relay:phase", RELAY_MODE === "live" ? "login" : "input");

  // On mount, read localStorage and sync — avoids SSR/hydration mismatch
  useEffect(() => {
    const saved = localStorage.getItem("relayMode") as "demo" | "live" | null;
    if (saved && saved !== RELAY_MODE) {
      setRelayModeState(saved);
      setPhase(saved === "live" ? "login" : "input");
    }
  }, []);

  const [text, setText] = useSessionPersist("relay:text", "");
  const [intent, setIntent] = useSessionPersist<ParsedIntent | null>("relay:intent", null);
  const [balance, setBalance] = useSessionPersist<Balance | null>("relay:balance", null);
  const [steps, setSteps] = useSessionPersist<Step[]>("relay:steps", []);
  const [result, setResult] = useSessionPersist<ExecutionResult | null>("relay:result", null);
  // Real, non-demo completed sends only — accumulates actual proof across
  // the session instead of only ever showing synthetic ticker data.
  // Client-side/sessionStorage only, capped at 10, no backend needed.
  const [realHistory, setRealHistory] = useSessionPersist<RealTick[]>("relay:realHistory", []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useSessionPersist<string | null>("relay:error", null);
  const [motionOn, setMotionOn] = useState(true);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [ownerAddress, setOwnerAddress] = useState<string | null>(null);

  // On mount, read localStorage and sync — avoids SSR/hydration mismatch
  useEffect(() => {
    const savedTheme = localStorage.getItem("relayTheme") as "dark" | "light" | null;
    if (savedTheme) setTheme(savedTheme);
  }, []);

  function toggleMode() {
    const next = relayMode === "demo" ? "live" : "demo";
    localStorage.setItem("relayMode", next);
    setRelayModeState(next);
    setText("");
    setIntent(null);
    setResult(null);
    setSteps([]);
    setError(null);
    setOwnerAddress(null);
    setPhase(next === "live" ? "login" : "input");
  }

  // Default motion off if the OS prefers reduced motion — but this is only
  // the STARTING value. The explicit toggle below always wins after that,
  // which is what makes it a real override instead of a suggestion.
  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) setMotionOn(false);
  }, []);

  // Restore Magic session on page load so returning users don't re-enter OTP
  useEffect(() => {
    const currentMode = (localStorage.getItem("relayMode") as "demo" | "live") ?? RELAY_MODE;
    if (currentMode !== "live") return;
    (async () => {
      try {
        const { isLoggedIn, getMagicSigner } = await import("../lib/magic");
        const loggedIn = await isLoggedIn();
        if (loggedIn) {
          const signer = await getMagicSigner();
          setOwnerAddress(signer.address);
          // Only advance past the login gate — don't stomp a phase (parsed/
          // executing/done) that useSessionPersist already restored.
          setPhase((p) => (p === "login" ? "input" : p));
        }
      } catch {
        // If Magic session check fails, leave on login screen — user will re-auth
      }
    })();
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
    localStorage.setItem("relayTheme", next);
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
    if (!address) {
      setError("Login succeeded but your wallet address is empty — please try again.");
      return;
    }
    setOwnerAddress(address);
    setPhase("input");
    setTimeout(() => mainSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  }

  // Shared by both the immediate post-login reveal and the refresh-on-parse
  // path below — a plain function (not inlined in either call site) so
  // there's exactly one place that knows how to fetch+auth a balance.
  async function fetchBalance() {
    try {
      // Live mode reads a real cross-chain balance — prove wallet ownership
      // first so the server isn't just trusting whatever address we send.
      let authProof: Partial<{ ownerAddress: string; authTimestamp: number; authSignature: string }> = {};
      if (relayMode === "live" && ownerAddress) {
        const { getMagicSigner } = await import("../lib/magic");
        const { signAuthProof } = await import("../lib/authMessage");
        const signer = await getMagicSigner();
        authProof = await signAuthProof(signer);
      }

      const balRes = await fetch("/api/balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: relayMode, ...authProof }),
      });
      const balData = await balRes.json();
      if (balData.error) setError(balData.error);
      setBalance(balData.balance ?? null);
    } catch {
      // Balance is supplementary to whatever else is happening on screen —
      // fail silently here rather than stomp a more specific error from
      // the caller (e.g. handleParse's own catch).
    }
  }

  // Show the unified balance the moment the wallet is ready — matches the
  // hero's promise ("Relay shows your unified balance up front") instead of
  // gating the reveal behind typing an intent. Fires on fresh login AND on
  // the restored-session path (both just set ownerAddress), and again if
  // relayMode ever changes while logged in.
  useEffect(() => {
    if (relayMode !== "live" || !ownerAddress) return;
    fetchBalance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownerAddress, relayMode]);

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

      // Refresh too, in case the balance changed between login and typing
      // — the immediate post-login fetch above is the FIRST reveal, not
      // the only one.
      await fetchBalance();
      setPhase("parsed");
    } catch {
      setError("Couldn't read that. Try rephrasing your request.");
    } finally {
      setBusy(false);
    }
  }

  async function handleExecute() {
    if (!intent) return;
    if (relayMode === "live" && !ownerAddress) {
      setError("Please log in before sending in live mode.");
      return;
    }
    setPhase("executing");
    setBusy(true);

    const initial: Step[] = [
      { label: "Reading your request", state: "done", detail: `${intent.amount} ${intent.token} → ${shorten(intent.recipient)}` },
      { label: "ZeroDev gas-sponsored check", state: "active" },
      { label: "Routing through your Universal Account", state: "idle" },
      { label: "Confirming on Arbitrum", state: "idle" },
    ];
    setSteps(initial);

    try {
      if (relayMode === "live" && ownerAddress) {
        // Prove wallet ownership before the server fires a real
        // gas-sponsored UserOp on our behalf.
        const { getMagicSigner } = await import("../lib/magic");
        const { signAuthProof } = await import("../lib/authMessage");
        const signer = await getMagicSigner();
        const authProof = await signAuthProof(signer);

        // Server fires ZeroDev sponsored UserOp + validates intent
        const validateRes = await fetch("/api/execute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ intent, mode: relayMode, ...authProof }),
        });
        const validateData = await validateRes.json();

        await tick(600);
        // Show ZeroDev result in step 1
        if (validateData.userOpHash) {
          setSteps((s) => mark(s, 1, "done", `userOp: ${validateData.userOpHash.slice(0, 18)}…`));
        } else {
          setSteps((s) => mark(s, 1, "done", validateData.zdError ? `check skipped: ${validateData.zdError.slice(0, 40)}` : "gas sponsored"));
        }
        setSteps((s) => mark(s, 2, "active"));
        await tick(700);

        if (!validateData.ready) {
          setSteps((s) => mark(s, 2, "error", validateData.error));
          setError(validateData.error ?? "Validation failed.");
          setPhase("done");
          setBusy(false);
          return;
        }

        setSteps((s) => mark(s, 2, "done", "sourced across chains"));
        setSteps((s) => mark(s, 3, "active"));
        await tick(400);

        // Client-side: sign and broadcast via Universal Account (reuse the
        // signer we already fetched above for the ownership proof)
        const { sendUnifiedTransfer } = await import("../lib/particle-ua");
        const txResult = await sendUnifiedTransfer({
          signer,
          to: intent.recipient!,
          amount: intent.amount!,
          token: intent.token ?? "USDC",
          tokenAddress: validateData.tokenAddress,
        });
        if (!txResult.ok) {
          // txResult.error already carries the real Particle error message
          // (+ JSON-RPC code, see lib/particle.ts) — log the whole result
          // too so a stale/truncated UI string is never the only record.
          console.error("[handleExecute] sendUnifiedTransfer failed:", txResult);
          setSteps((s) => mark(s, 3, "error", txResult.error));
          setError(txResult.error ?? "Transfer failed.");
          setPhase("done");
          setBusy(false);
          return;
        }
        setSteps((s) => mark(s, 3, "done", txResult.userOpHash ?? txResult.transactionId ?? txResult.txHash));
        setResult({
          ...txResult,
          ok: true,
          userOpHash: validateData.userOpHash ?? txResult.userOpHash,
        });
        // Real, non-demo send — accumulate as verifiable proof for the
        // ticker, kept structurally separate from DEMO_TICKS (Rule 3:
        // never conflate real and synthetic data).
        const realTxHash = txResult.txHash ?? txResult.transactionId ?? validateData.userOpHash;
        if (realTxHash && intent.recipient) {
          setRealHistory((h) =>
            [
              {
                amount: intent.amount!,
                token: intent.token ?? "USDC",
                recipient: intent.recipient!,
                txHash: realTxHash,
                timestamp: Date.now(),
                explorerUrl: txResult.explorerUrl,
              },
              ...h,
            ].slice(0, 10)
          );
        }
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
      // Full underlying error — a generic caught-exception path (network
      // drop, unexpected throw) that isn't already logged closer to its
      // source above.
      console.error("[handleExecute] uncaught error:", { message: err?.message, code: err?.code, stack: err?.stack, raw: err });
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
    clearRelaySession();
    // clearRelaySession() wipes every "relay:"-prefixed key, but
    // realHistory is cumulative verified proof, not per-flow UI state —
    // "send another" should never erase a real send that already
    // happened. Re-persist the current value right after the blanket
    // clear (React state itself was never touched, only storage).
    setRealHistory(realHistory);
  }

  return (
    <main className={`relative overflow-hidden bg-ink transition-colors duration-300 ${motionOn ? "" : "motion-off"} ${theme === "light" ? "light" : ""}`}>
      <ParticleField paused={!motionOn} />

      <div className="relative z-10 mx-auto max-w-4xl px-6 pb-16">
        {/* Frame rules — only show above 2xl, where the centered column
            leaves enough side margin that it can read as unfinished empty
            space rather than a deliberate editorial gutter. Same hairline
            weight as the border-t dividers already used throughout, just
            vertical and very low opacity so it stays a quiet frame, not a
            new visual element competing with content. Negative z-index
            keeps these behind the (unpositioned, "auto"-stacked) content
            that follows, without needing to touch anything else's z-index. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 -z-10 hidden border-l border-line/40 2xl:block"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 -z-10 hidden border-r border-line/40 2xl:block"
        />

        <header className="flex items-center justify-between border-b border-line py-5">
          <div className="flex items-center gap-3">
            <svg width="28" height="28" viewBox="0 0 30 30" fill="none" className="shrink-0 text-chalk">
              <circle cx="6" cy="7" r="2.2" fill="currentColor" opacity="0.5" />
              <circle cx="24" cy="7" r="2.2" fill="currentColor" opacity="0.5" />
              <circle cx="15" cy="24" r="2.2" fill="currentColor" opacity="0.5" />
              <path d="M6 7 L15 15 M24 7 L15 15 M15 24 L15 15" stroke="currentColor" strokeWidth="1" opacity="0.3" />
              <circle cx="15" cy="15" r="3.4" fill="currentColor" />
            </svg>
            <span className="font-display text-2xl font-semibold tracking-tight text-chalk sm:text-3xl">
              Relay
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Icon-only controls at every width — real Material Symbols
                glyphs read clearly at 18px, so there's no need for a
                separate mobile/desktop text-label split anymore; this is
                also narrower than the old text-pill versions, which is
                what actually fixes the 375px header overflow. */}
            <button
              onClick={toggleMode}
              className={`flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider transition hover:opacity-80 ${
                relayMode === "live" ? "border-check text-check" : "border-line2 text-mist"
              }`}
              title={`Switch to ${relayMode === "live" ? "demo" : "live"} mode`}
            >
              {relayMode}
              <Icon name={relayMode === "live" ? "bolt" : "science"} className="text-[16px] align-middle" />
            </button>
            <button
              ref={themeToggleRef}
              onClick={handleThemeToggle}
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              aria-label="Toggle theme"
              className="flex shrink-0 items-center justify-center rounded-full border border-line p-1.5 text-mist hover:text-chalk"
            >
              <Icon name={theme === "dark" ? "dark_mode" : "light_mode"} className="text-[18px] align-middle" />
            </button>
            <button
              onClick={() => setMotionOn((m) => !m)}
              title={motionOn ? "Pause motion" : "Resume motion"}
              aria-label="Toggle motion"
              className="flex shrink-0 items-center justify-center p-1 text-dim hover:text-chalk"
            >
              <Icon name={motionOn ? "animation" : "motion_photos_off"} className="text-[18px] align-middle" />
            </button>
          </div>
        </header>

        {!heroCollapsed && (
          <>
            <div ref={heroReveal.ref} className={`relative py-16 text-center ${heroReveal.className}`}>
              <AmbientOrb variant="a" className="-top-24 -right-64" />
              <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.2em] text-dim">
                Universal Accounts · EIP-7702 · Arbitrum
              </p>
              <h1 className="mx-auto mb-5 max-w-xl font-display text-4xl font-medium leading-tight tracking-tight text-chalk sm:text-5xl">
                Money that moves the way you <CyclingWord motionOn={motionOn} />.
              </h1>
              <p className="mx-auto mb-8 max-w-md text-mist">
                Relay reads a sentence, finds your funds across every chain, and sends — no gas, no bridging, no seed phrase.
              </p>
            </div>
            <div ref={tickerReveal.ref} className={tickerReveal.className}>
              <TransactionTicker realHistory={realHistory} />
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
                {/* Live mode: always show wallet section — address if known, connect prompt if not */}
                {relayMode === "live" && !ownerAddress && (
                  <div className="mb-6 rounded-2xl border border-line bg-slate p-5">
                    <p className="mb-1 font-mono text-[9px] uppercase tracking-widest text-dim">Your wallet</p>
                    <p className="mb-4 text-sm text-mist">Connect your wallet to see your address and start sending.</p>
                    <MagicLogin onLogin={handleLoginSuccess} />
                  </div>
                )}

                {ownerAddress && (
                  <div className="mb-6 rounded-2xl border border-check/30 bg-slate p-5 space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-check animate-pulse" />
                      <p className="font-mono text-[10px] uppercase tracking-widest text-check">Wallet ready</p>
                    </div>

                    {/* Magic EOA address — this is what Particle UA reads across all chains */}
                    <div>
                      <p className="mb-1 font-mono text-[9px] uppercase tracking-widest text-dim">Your address</p>
                      <div className="flex items-center gap-2 rounded-lg border border-line bg-ink px-3 py-2.5">
                        <p className="flex-1 break-all font-mono text-xs text-chalk leading-relaxed">{ownerAddress}</p>
                        <button
                          onClick={() => copyToClipboard(ownerAddress, "address")}
                          className="flex shrink-0 items-center gap-1 rounded border border-line px-2.5 py-1 font-mono text-[10px] text-mist transition hover:border-line2 hover:text-chalk"
                        >
                          <Icon name={copied === "address" ? "check" : "content_copy"} className="text-[14px] align-middle" />
                          {copied === "address" ? "copied" : "copy"}
                        </button>
                      </div>
                    </div>

                    {/* Funding guide */}
                    <div className="rounded-lg border border-line bg-ink/60 p-3">
                      <p className="mb-2 font-mono text-[9px] uppercase tracking-widest text-dim">Fund your wallet</p>
                      <ol className="space-y-1 text-xs text-mist">
                        <li className="flex gap-2"><span className="shrink-0 text-dim">1.</span>Copy your address above</li>
                        <li className="flex gap-2"><span className="shrink-0 text-dim">2.</span>Send USDC on Arbitrum, Base, Optimism, or Polygon mainnet</li>
                        <li className="flex gap-2"><span className="shrink-0 text-dim">3.</span>Type what you want to send below — Relay finds the funds across chains</li>
                      </ol>
                      <div className="mt-3 flex gap-3 border-t border-line pt-3">
                        <a href="https://faucet.circle.com" target="_blank" rel="noreferrer"
                          className="flex items-center gap-0.5 font-mono text-[9px] uppercase tracking-wider text-dim underline hover:text-check transition">
                          USDC faucet <Icon name="open_in_new" className="text-[14px] align-middle no-underline" />
                        </a>
                        <a href="https://bridge.arbitrum.io" target="_blank" rel="noreferrer"
                          className="flex items-center gap-0.5 font-mono text-[9px] uppercase tracking-wider text-dim underline hover:text-check transition">
                          Arbitrum bridge <Icon name="open_in_new" className="text-[14px] align-middle no-underline" />
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* Up-front reveal — shows as soon as fetchBalance resolves
                    post-login, before any typing. UnifiedBalance itself
                    renders nothing while balance is still null. */}
                {ownerAddress && (
                  <div className="mb-6">
                    <UnifiedBalance balance={balance} />
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
                      {busy ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="h-3 w-3 animate-spin rounded-full border border-ink/30 border-t-ink" />
                          reading…
                        </span>
                      ) : (
                        "Send →"
                      )}
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
                      className="flex items-center gap-1 font-mono text-sm text-mist hover:text-chalk transition"
                      title={intent.recipient ?? ""}
                    >
                      {shorten(intent.recipient)}
                      <Icon name={copied === "deposit" ? "check" : "content_copy"} className="text-[15px] align-middle" />
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
                  {intent.recipient && !intent.recipient.startsWith("0x") && (
                    <p className="mt-3 rounded-lg border border-line2 bg-ink p-2 text-xs text-mist">
                      ENS names aren't supported yet — paste the full 0x address instead.
                    </p>
                  )}
                  {!intent.amount && (
                    <p className="mt-3 rounded-lg border border-line2 bg-ink p-2 text-xs text-mist">
                      No amount found. Try: "send 5 USDC to 0x…"
                    </p>
                  )}

                  <div className="mt-5 flex gap-3">
                    <button onClick={reset} className="rounded-lg border border-line px-4 py-2 text-sm text-mist hover:text-chalk">
                      back
                    </button>
                    <button
                      onClick={handleExecute}
                      disabled={
                        !intent.recipient ||
                        !intent.recipient.startsWith("0x") ||
                        !intent.amount ||
                        intent.action !== "transfer"
                      }
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

                {phase === "executing" && (
                  <button onClick={reset} className="font-mono text-xs text-dim hover:text-chalk">
                    stuck? start over
                  </button>
                )}

                {phase === "done" && !result?.ok && !error && (
                  <div className="rounded-2xl border border-line2 bg-slate p-6">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-mist">
                      Didn&apos;t go through
                    </span>
                    <p className="mt-2 text-sm text-chalk">
                      {result?.error ?? "We couldn't confirm what happened with this send. It may not have gone through."}
                    </p>
                    <button onClick={reset} className="mt-4 rounded-lg border border-line px-4 py-2 text-sm text-mist hover:text-chalk">
                      start over
                    </button>
                  </div>
                )}

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
                          className="flex items-center gap-0.5 font-mono text-xs text-check underline"
                        >
                          view transaction <Icon name="open_in_new" className="text-[14px] align-middle no-underline" />
                        </a>
                        {(result.txHash ?? result.transactionId) && (
                          <button
                            onClick={() => copyToClipboard(result.txHash ?? result.transactionId ?? "", "address")}
                            className="flex items-center gap-1 font-mono text-[10px] text-dim hover:text-chalk transition"
                          >
                            <Icon name={copied === "address" ? "check" : "content_copy"} className="text-[13px] align-middle" />
                            {copied === "address" ? "copied" : "copy tx id"}
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
            />
          </div>
        </div>

        <div ref={howReveal.ref} className={`relative mt-20 border-t border-line pt-14 ${howReveal.className}`}>
          <AmbientOrb variant="b" className="-bottom-40 -left-64" />
          {/* Margin annotation — reuses this section's own eyebrow text,
              just smaller/rotated/dimmer, so the left margin reads as a
              quiet marginal note rather than a second headline. Left only
              (right margin stays clean) to avoid clutter. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-0 top-14 hidden whitespace-nowrap font-mono text-[9px] uppercase tracking-[0.25em] text-dim/60 2xl:block"
            style={{ writingMode: "vertical-rl", transform: "translateX(-2.75rem) rotate(180deg)" }}
          >
            How it works
          </span>
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

        <div ref={receiptReveal.ref} className={`relative mt-16 border-t border-line pt-14 ${receiptReveal.className}`}>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-0 top-14 hidden whitespace-nowrap font-mono text-[9px] uppercase tracking-[0.25em] text-dim/60 2xl:block"
            style={{ writingMode: "vertical-rl", transform: "translateX(-2.75rem) rotate(180deg)" }}
          >
            A payment, verified
          </span>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-dim">A payment, verified</p>
          <h2 className="mb-2 max-w-md font-display text-2xl font-medium tracking-tight text-chalk">
            Every send, on the record.
          </h2>
          <p className="mb-8 max-w-md text-sm text-mist">
            Each payment settles on Arbitrum and is verifiable by anyone — the receipt, not a promise.
          </p>
          <PaymentReceipt
            quote="Verified test transaction — Relay's wallet delegated via EIP-7702 and sent 0.0002 ETH on Arbitrum One mainnet. Confirmed independently on Arbiscan."
            who="Relay · Arbitrum One mainnet"
            hash="0x118ff441…f80dcfe"
            hashLink="https://arbiscan.io/tx/0x118ff441d1bb070c000b74a940ebc3637dfd3d989781321bd8ec47b22f80dcfe"
          />
        </div>

        <footer className="mt-16 border-t border-line pt-8">
          <div className="flex flex-col gap-10 sm:flex-row">
            <div className="flex flex-col gap-3">
              <p className="font-mono text-[9px] uppercase tracking-widest text-dim">Project</p>
              <a href="https://github.com/Chibey-max/relay" target="_blank" rel="noreferrer" className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-mist hover:text-chalk">
                GitHub <Icon name="open_in_new" className="text-[14px] align-middle" />
              </a>
              <a
                href={`${EXPLORER}/address/${RELAY_POLICY_ADDRESS}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-mist hover:text-chalk"
              >
                Contract <Icon name="open_in_new" className="text-[14px] align-middle" />
              </a>
              <a
                href="https://arbiscan.io/tx/0x118ff441d1bb070c000b74a940ebc3637dfd3d989781321bd8ec47b22f80dcfe"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-mist hover:text-chalk"
              >
                Live transaction <Icon name="open_in_new" className="text-[14px] align-middle" />
              </a>
            </div>
            <div className="flex flex-col gap-3">
              <p className="font-mono text-[9px] uppercase tracking-widest text-dim">Hackathon</p>
              <a
                href="https://www.encodeclub.com/programmes/uxmaxx-hackathon"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-mist hover:text-chalk"
              >
                Built for UXmaxx Hackathon <Icon name="open_in_new" className="text-[14px] align-middle" />
              </a>
              <span className="font-mono text-[10px] uppercase tracking-wider text-mist">Universal Accounts Track</span>
              <span className="font-mono text-[10px] uppercase tracking-wider text-mist">Particle · Magic · ZeroDev · Arbitrum</span>
            </div>
          </div>
          <p className="mt-8 border-t border-line pt-4 text-xs leading-relaxed text-mist">
            Policy contract verified on Arbitrum Sepolia — settlement proven on Arbitrum One mainnet.
          </p>
        </footer>
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
