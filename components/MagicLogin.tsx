"use client";

import { useState } from "react";

interface Props {
  onLogin: (address: string) => void;
}

export default function MagicLogin({ onLogin }: Props) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    if (!email.trim()) return;
    setBusy(true);
    setSent(false);
    setError(null);
    try {
      const { loginWithEmail } = await import("../lib/magic");
      // Tell the user to check email before awaiting the OTP
      setSent(true);
      const { address } = await loginWithEmail(email.trim());
      onLogin(address);
    } catch (err: any) {
      setSent(false);
      setError(err?.message ?? "Login failed. Try again.");
    } finally {
      setBusy(false);
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
        /* After email submitted — waiting for OTP in Magic popup */
        <div className="rounded-xl border border-line bg-ink/60 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-check" />
            <p className="font-mono text-[10px] uppercase tracking-widest text-check">Code sent</p>
          </div>
          <p className="text-sm text-chalk">
            Check <span className="font-mono text-mist">{email}</span> for a 6-digit code.
          </p>
          <p className="text-xs text-mist">
            A Magic popup should appear on this page — enter the code there. If you don't see it, check your spam folder or{" "}
            <button
              onClick={() => { setSent(false); setBusy(false); }}
              className="underline hover:text-chalk transition"
            >
              try again
            </button>
            .
          </p>
          <div className="flex items-center gap-2 pt-1">
            <span className="inline-block h-3 w-3 animate-spin rounded-full border border-mist/30 border-t-mist" />
            <span className="font-mono text-[10px] text-dim">Waiting for you to enter the code…</span>
          </div>
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
