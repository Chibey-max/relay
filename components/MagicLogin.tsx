"use client";

import { useState } from "react";

interface Props {
  onLogin: (address: string) => void;
}

export default function MagicLogin({ onLogin }: Props) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    if (!email.trim()) return;
    setBusy(true);
    setSent(false);
    setError(null);
    try {
      const { loginWithEmail } = await import("../lib/magic");
      setSent(true);
      const { address } = await loginWithEmail(email.trim());
      // Promise resolved via popup postMessage — proceed
      onLogin(address);
    } catch (err: any) {
      // If it's a popup/postMessage failure the promise rejects.
      // We keep sent=true so the user can use the manual check button.
      if (!sent) setSent(false);
      setError(null); // don't show error — tell them to use the button below
    } finally {
      setBusy(false);
    }
  }

  // Fallback: user entered code in Magic popup/tab but postMessage failed.
  // Manually check if their session is now active.
  async function handleManualCheck() {
    setChecking(true);
    setError(null);
    try {
      const { isLoggedIn, getMagicSigner } = await import("../lib/magic");
      const loggedIn = await isLoggedIn();
      if (loggedIn) {
        const signer = await getMagicSigner();
        onLogin(signer.address);
      } else {
        setError("Session not found. Make sure you entered the correct code, then try again.");
        setSent(false);
      }
    } catch (err: any) {
      setError(err?.message ?? "Could not verify session. Try logging in again.");
      setSent(false);
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="space-y-4">
      {!sent ? (
        <>
          <div className="space-y-1">
            <label className="block font-mono text-[10px] uppercase tracking-widest text-dim">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-line bg-slate px-4 py-3 font-mono text-sm text-chalk placeholder:text-dim focus:border-line2 focus:outline-none"
            />
          </div>

          <button
            onClick={handleLogin}
            disabled={busy || !email.trim()}
            className="w-full rounded-xl bg-chalk px-5 py-3 text-sm font-medium text-ink transition hover:opacity-90 disabled:opacity-40"
          >
            {busy ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block h-3 w-3 animate-spin rounded-full border border-ink/30 border-t-ink" />
                Sending code…
              </span>
            ) : (
              "Continue with email →"
            )}
          </button>
        </>
      ) : (
        <div className="space-y-3">
          <div className="rounded-xl border border-line bg-ink/60 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-check" />
              <p className="font-mono text-[10px] uppercase tracking-widest text-check">Code sent to {email}</p>
            </div>
            <ol className="space-y-1 text-sm text-mist">
              <li className="flex gap-2"><span className="text-dim shrink-0">1.</span>Check your inbox for a 6-digit code</li>
              <li className="flex gap-2"><span className="text-dim shrink-0">2.</span>Enter it in the Magic popup or tab that opened</li>
              <li className="flex gap-2"><span className="text-dim shrink-0">3.</span>Click the button below once you've entered it</li>
            </ol>
          </div>

          {/* Primary CTA — for when postMessage back fails */}
          <button
            onClick={handleManualCheck}
            disabled={checking}
            className="w-full rounded-xl bg-chalk px-5 py-3 text-sm font-medium text-ink transition hover:opacity-90 disabled:opacity-40"
          >
            {checking ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block h-3 w-3 animate-spin rounded-full border border-ink/30 border-t-ink" />
                Verifying…
              </span>
            ) : (
              "I've entered the code — continue →"
            )}
          </button>

          <button
            onClick={() => { setSent(false); setBusy(false); setError(null); }}
            className="block w-full text-center font-mono text-xs text-dim hover:text-chalk transition"
          >
            ← use a different email
          </button>
        </div>
      )}

      {error && (
        <p className="rounded-lg border border-line bg-slate px-3 py-2 font-mono text-xs text-mist">
          {error}
        </p>
      )}

      <p className="text-center font-mono text-[9px] uppercase tracking-widest text-dim">
        Non-custodial · no seed phrase · Magic
      </p>
    </div>
  );
}
