# Relay

**Speak your money.** One sentence becomes a cross-chain payment — no chains to pick, no gas to pay, no seed phrase.

🔗 **Live app:** [relay-ashen-zeta.vercel.app](https://relay-ashen-zeta.vercel.app)
📜 **Contract (Arbitrum Sepolia):** [`0x8DD23aBBA62f10306805F0B2C8BF8459d1C3974e`](https://sepolia.arbiscan.io/address/0x8DD23aBBA62f10306805F0B2C8BF8459d1C3974e)
🐙 **Repo:** [github.com/Chibey-max/relay](https://github.com/Chibey-max/relay)

Built for the [UXmaxx Hackathon](https://www.encodeclub.com/programmes/uxmaxx-hackathon) — **Universal Accounts Track**.

---

## What it does

Relay is a natural-language payment agent. You type *"send 5 USDC to 0x…"* and Relay fulfils it through your **Particle Universal Account in EIP-7702 mode** — finding your funds wherever they live across chains, unifying them into one balance, sponsoring the gas, and confirming on Arbitrum. The entire interaction stays a single sentence.

The hero of the product isn't the sentence — it's the **unified balance reveal**: money scattered across Base, Arbitrum, and Optimism, shown as one spendable number. Universal Accounts is the visible magic; the agent is just how you spend it. Your existing EOA is upgraded in place via EIP-7702 — no new address, no migration, no smart-account deployment.

---

## Prize tracks targeted

| Track | Prize | How Relay qualifies |
|---|---|---|
| **Universal Accounts Track** (main) | $2,500 / $2,000 / $1,500 | Particle UA SDK in EIP-7702 mode is the spine — unified balance reveal + real cross-chain transfer. Meets all three hard requirements: UA in 7702 mode, ≥1 cross-chain value operation, functional deployed demo. |
| **Arbitrum "Road to Open House" bounty** | $2,000 (track-agnostic) | Runs primarily on Arbitrum; chain-abstracted UX (embedded wallet, gas abstraction via ZeroDev, invisible bridging via UA) with a contract deployed and verified on Arbitrum Sepolia. |
| **Magic Labs bonus** | $500 (track-agnostic, single competitive winner) | Email login → real embedded wallet. No seed phrase, no MetaMask, no extension. |

Realistic ceiling if 1st on the main track: **$5,000** ($2,500 + $2,000 + $500), from one coherent submission, no bolted-on integrations.

> Note: the hackathon's ZeroDev subtrack ($500 × 4 winners, judged on Smart Routing Address usage) is nested under the **General Track**, which is mutually exclusive with the Universal Accounts Track — you submit to one main track, not both. Relay targets Universal Accounts, so it isn't eligible for that subtrack, and doesn't claim to be. ZeroDev's gas sponsorship + on-chain spend-policy enforcement are real and live (see `lib/zerodev.ts`, `contracts/src/RelayPolicy.sol`) — they support the Arbitrum bounty's "gas abstraction" criterion, not a separate ZeroDev prize claim.

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
  ZeroDev paymaster             lib/zerodev.ts     → gasless UserOp for local actions
        │
        ▼
  RelayPolicy.sol               contracts/         → on-chain spend limits (Arbitrum Sepolia)
        │
        ▼
  Real result + Arbiscan link
```

Single Next.js 14 App Router repo — all logic in `app/api/*` routes, one Vercel deploy. No separate backend.

---

## Run it locally

```bash
git clone https://github.com/Chibey-max/relay.git
cd relay
cp .env.example .env.local       # demo mode works with zero keys
npm install
npm run dev                      # http://localhost:3000
```

**Demo mode** (`NEXT_PUBLIC_RELAY_MODE=demo`) runs the full flow on a pre-seeded test signer — no login required, safe to demo anywhere. Every demo result is clearly badged as demo, never presented as a real transaction.

**Live mode** (`NEXT_PUBLIC_RELAY_MODE=live`) is what's running in production. To run it yourself, add real keys:

1. **Particle** — [dashboard.particle.network](https://dashboard.particle.network) → `PROJECT_ID`, `CLIENT_KEY`, `APP_ID`
2. **Magic** — [dashboard.magic.link](https://dashboard.magic.link) → publishable key, Email OTP enabled
3. **ZeroDev** — [dashboard.zerodev.app](https://dashboard.zerodev.app) → Arbitrum Sepolia, gas sponsorship policy
4. **Groq** — [console.groq.com](https://console.groq.com) → API key

---

## Deployed contract

`RelayPolicy.sol` enforces per-recipient spend limits so the agent can only move value within bounds the user set — even though the UX is a single sentence. Every limit is per-recipient, read from storage, never a hardcoded global constant.

```bash
cd contracts
forge script script/Deploy.s.sol \
  --rpc-url $ARB_SEPOLIA_RPC --broadcast --verify \
  --etherscan-api-key $ARBISCAN_KEY
```

Deployed and verified at [`0x0de937c8def5284F8e2F0E2546a891EFe67909cb`](https://sepolia.arbiscan.io/address/0x0de937c8def5284F8e2F0E2546a891EFe67909cb) on Arbitrum Sepolia.

---

## Getting test funds

- Arbitrum Sepolia ETH: any Sepolia faucet → [bridge.arbitrum.io](https://bridge.arbitrum.io) (testnet mode)
- Test USDC: [faucet.circle.com](https://faucet.circle.com) → Arbitrum Sepolia

---

## Design principles

Six rules, derived from prior hackathon wins and losses, govern this build:

1. **Every partner SDK makes a real network call** — not instantiated, called.
2. **Demo/live mode is visible in the UI** — nothing hidden from judges.
3. **No claim in this README isn't true in the code** — demo results are badged, never presented as real.
4. **Verifiable testnet address, not localhost** — see contract link above.
5. **Features mapped to prize tracks inside the app itself** — see the Integration Status panel on the live site.
6. **Honest about what isn't live** — graceful fallbacks, clearly labelled.

---

## Status

Particle Universal Accounts was mid-migration to V2 during the hackathon window. If a balance fetch ever surfaces a migration notice, the app states it honestly rather than faking a number — this is intentional, not a bug.
