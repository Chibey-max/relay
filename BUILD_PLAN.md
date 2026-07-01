# Relay — Build Plan: Win One Track, Stack Four

**The decision:** Play to win the **Universal Accounts Track** ($2,500). The other three prizes (Arbitrum $2,000, Magic $500, ZeroDev $500×4) are built *solid and live* — never lavished over. 100% of your polish budget goes into one moment.

This avoids the failure mode of being eligible-everywhere-but-strong-nowhere. You are strong in exactly one place, and that strength radiates into the rest.

---

## Why Universal Accounts is the point to concentrate on

- It's the only track where winning **automatically strengthens the other three**. A great UA app needs frictionless login (Magic), funding from any chain (ZeroDev SRA), and Arbitrum deployment (Arbitrum bounty). Excellence radiates outward.
- Particle judges the main track, runs the hackathon, and offers **incubation** to UA winners. Winning is worth more than the purse.
- Your scaffold is already built around it.

The cost: UA is the most contested track. To win, the UA experience must be the single most memorable demo moment of the week — not just "integrated," but "wait, how did it do that?"

---

## The ONE moment that wins (where 100% of polish goes)

> The user types one sentence. Money scattered across Base, Arbitrum, and Optimism **visibly converges into one number**. They confirm. It's sent cross-chain — no gas, no chain picker, no seed phrase. A real tx hash appears.

That 8-second sequence is the product. It scores the 40% UX + 30% UA-prominence = **70% of the main track**. Everything else is plumbing.

**What "polish" means here, concretely:**
- The balance reveal animation (`UnifiedBalance.tsx`) must feel like convergence — scattered chains snapping into one total. Time it, ease it, make it land.
- The execution steps (`ExecutionSteps.tsx`) must *narrate the magic* — "finding your funds across chains," "no bridging, no gas" — so the judge sees what UA did, not a spinner.
- The "sourced across chains" badge after sending is the proof. Make it unmissable.
- Copy is tuned: plain verbs, no crypto jargon. A non-crypto judge understands every word.
- The whole flow works on mobile, with reduced-motion respected.

Spend days here. Re-record the demo until this moment is flawless.

---

## Everything else: SOLID AND LIVE, not polished

Each of these must be genuinely live (Rule 1) and verifiable (Rule 3) — but plain. No extra time beyond "it works and a judge can confirm it."

### Magic login — just live ($500 byproduct)
- `loginWithEmail(email)` returns a real EOA. No seed phrase, no MetaMask.
- Success bar: judge enters email, gets a wallet. Done. Don't over-design the login screen.

### ZeroDev Smart Routing Address — just live ($500, 4 winners byproduct)
- Add `lib/zerodev-sra.ts`: `createSmartRoutingAddress(ownerAddress)`.
- This is the **deposit mechanism** — "Fund Relay: send any token on any chain here." That makes ZeroDev structurally core, satisfying the subtrack.
- Success bar: a real SRA address is returned and a test deposit routes in. Keep the existing gasless `sendSponsoredUserOp` too. Don't build a deposit dashboard — one address + a confirmation is enough.

### Arbitrum deploy — just live ($2,000 byproduct)
- Deploy `RelayPolicy.sol` to Arbitrum Sepolia, verify on Arbiscan, link in README + Integration Status panel.
- Wire `checkAndRecord` so the policy actually runs before a transfer (not decorative).
- Success bar: contract address verified on Arbiscan, enforcement live. Don't add contract features — the spending policy is enough.

---

## Build order (concentration-first)

1. **Make the ONE moment real, end to end, in LIVE mode** — Magic → UA balance → spoken transfer → real tx hash. Get the full magic working before polishing anything. (Steps 1, 2, 4 of the integration prompt.)
2. **Add ZeroDev SRA deposit + Arbitrum deploy** — solid and live. (Steps 3, 5.)
3. **Now pour the remaining time into polishing the ONE moment** — animation, narration, copy, mobile, demo video. This is most of your weeks.
4. **Submission hygiene** — Vercel URL, demo/live toggle, only claim what's verifiable, honest roadmap line for Openfort.

---

## The test before you submit

For the main track, ask: *would a judge who's seen 40 payment apps remember Relay's balance-reveal moment?* If yes, you're winning UA. If it's "just another clean payment app," you've spread too thin — pull time back from the byproducts and into the moment.

For each byproduct prize, ask only: *can a judge verify this is live in 30 seconds?* If yes, it's done. Resist polishing it further.

---

## What NOT to do

- Don't split polish evenly across four integrations. That's the eligible-everywhere-strong-nowhere trap.
- Don't add Openfort for $100 — it forks your auth layer and creates a seam. Honest roadmap line only.
- Don't claim anything not live. A badged demo result is fine; a false "live" claim is disqualifying (the T3 lesson).
- Don't let the cyberpunk UI eat time the balance-reveal moment needs. The moment is the product; the chrome is not.
