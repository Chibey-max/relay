"use client";

import { useState } from "react";

interface Props {
  onLogin: (address: string) => void;
}

export default function MagicLogin({ onLogin }: Props) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    if (!email.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const { loginWithEmail } = await import("../lib/magic");
      const { address } = await loginWithEmail(email.trim());
      console.log("[Magic] EOA:", address);
      onLogin(address);
    } catch (err: any) {
      setError(err?.message ?? "Login failed. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm space-y-4 pt-4">
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
            Opening wallet…
          </span>
        ) : (
          "Continue with email →"
        )}
      </button>

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
