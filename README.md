# Relay

**Speak your money.** One sentence becomes a cross-chain payment — no chains to pick, no gas to pay, no seed phrase.

Relay is a natural-language payment agent for the [UXmaxx Hackathon](https://www.encodeclub.com/programmes/uxmaxx-hackathon). You type *"send 5 USDC to 0x…"* and Relay fulfils it through your **Particle Universal Account in EIP-7702 mode**, sourcing funds across chains, sponsoring gas, and confirming on Arbitrum — while the experience stays a single sentence.

The hero isn't the sentence. The hero is the **unified balance**: money scattered across Base, Arbitrum, and Optimism, shown as one spendable number. The agent is just how you spend it.

---

## Why this wins (rubric mapping)

The Universal Accounts Track is judged on: **UX excellence (40%)**, **prominent/innovative use of UA + EIP-7702 (30%)**, **adoption potential (20%)**, **technical quality (10%)**.

| Criterion | How Relay scores |
|---|---|
| UX excellence (40%) | The entire interaction is one sentence. No chain picker, gas estimator, or seed phrase appears anywhere. |
| UA + EIP-7702 (30%) | The unified-balance reveal makes UA the visible hero, not plumbing. The EOA is upgraded in place via 7702 — no new address, no migration. |
| Adoption potential (20%) | Payments everyone understands. A non-crypto user completes a cross-chain transfer on first contact. |
| Technical quality (10%) | Clean Next.js app, typed throughout, deployed contract verified on Arbiscan. |

### Stacked prizes — four tracks, one coherent product ($5,500 ceiling)

Every integration is load-bearing. None is decorative — that's the difference between stacking prizes and getting caught bolting on SDKs.

| Prize | Integration (why it's core, not bolted on) | Where |
|---|---|---|
| Universal Accounts Track ($2,500) | Particle UA in 7702 mode is the spine: unified balance + cross-chain transfer | `lib/particle.ts` |
| Arbitrum bounty ($2,000) | "AI apps with invisible onchain payments" — their literal lead example; deployed on Arbitrum | `contracts/` + Vercel |
| Magic Labs bonus ($500) | Email login → EOA. No MetaMask, no seed phrase | `lib/magic.ts` |
| ZeroDev subtrack ($500, 4 winners) | Smart Routing Address is the deposit mechanism — fund Relay from any chain. ZeroDev is structurally required | `lib/zerodev.ts` |

**Openfort ($100, x402 agentic payments):** the architecture is compatible, but not integrated — listed honestly as roadmap (Rule 6), not claimed as live. Adding a second wallet stack for $100 would create a seam; the four above stay clean.

---

## Architecture

```
"send 5 USDC to 0x…"
        │
        ▼
  Groq intent parser            lib/groq.ts        → { action, amount, token, recipient }
        │
        ▼
  Magic email login             lib/magic.ts       → user's EOA (no seed phrase)
        │
        ▼
  Particle Universal Account    lib/particle.ts    → one balance across chains (7702 mode)
        │                                              ↳ getPrimaryAssets() — the reveal
        ▼
  Cross-chain transfer          lib/particle.ts    → createTransferTransaction()
        │                                              ↳ sources liquidity automatically
        ▼
  ZeroDev paymaster (optional)  lib/zerodev.ts     → gasless UserOp for local actions
        │
        ▼
  RelayPolicy.sol               contracts/         → on-chain spend limits (Arbitrum)
        │
        ▼
  Real result + Arbiscan link
```

No separate backend — all logic lives in Next.js API routes (`app/api/*`). Single Vercel deploy.

---

## Run it

```bash
cp .env.example .env.local       # demo mode works with zero keys
npm install
npm run dev                      # http://localhost:3000
```

**Demo mode** (`NEXT_PUBLIC_RELAY_MODE=demo`) runs the full flow on a pre-seeded test signer — no login, safe to show anywhere. Every demo result is badged as demo (never presented as a real tx).

**Live mode** (`NEXT_PUBLIC_RELAY_MODE=live`) activates the moment you add real keys:

1. **Particle** — [dashboard.particle.network](https://dashboard.particle.network) → `PROJECT_ID`, `CLIENT_KEY`, `APP_ID`
2. **Magic** — [dashboard.magic.link](https://dashboard.magic.link) → publishable key, email OTP enabled
3. **ZeroDev** — [dashboard.zerodev.app](https://dashboard.zerodev.app) → Arbitrum Sepolia, "Sponsor All" gas policy
4. **Groq** — [console.groq.com](https://console.groq.com) → API key

### Deploy the contract

```bash
cd contracts
forge install foundry-rs/forge-std
forge script script/Deploy.s.sol \
  --rpc-url $ARB_SEPOLIA_RPC --broadcast --verify \
  --etherscan-api-key $ARBISCAN_KEY
```

Then paste the deployed address into the README and the app's Integration Status panel.

---

## The six rules this build follows

Derived from prior hackathon wins and losses:

1. **Every partner SDK makes a real network call** — not instantiated, called.
2. **Demo/live toggle visible in the UI** — judges see both, nothing hidden.
3. **No claim in the submission that isn't true in the code** — demo results are badged demo.
4. **Verifiable testnet address in the README** — not localhost.
5. **Features mapped to prize tracks inside the app** — the Integration Status panel.
6. **Honest about what isn't live** — graceful fallbacks, labelled.

---

## Getting test funds

- Arbitrum Sepolia ETH: any Sepolia faucet → [bridge.arbitrum.io](https://bridge.arbitrum.io) (testnet)
- Test USDC: [faucet.circle.com](https://faucet.circle.com) → Arbitrum Sepolia
- Or use testETH directly — the demo works with either.

---

## Status

Particle UA is migrating to V2 during the hackathon window. If `getPrimaryAssets()` returns a migration notice, the app surfaces it honestly (Rule 6) rather than faking a balance. Demo mode is unaffected.
