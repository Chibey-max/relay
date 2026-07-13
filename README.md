# Relay

**Speak your money.** One sentence becomes a cross-chain payment — no chains to pick, no gas to pay, no seed phrase.

🔗 **Live app:** [relay-ashen-zeta.vercel.app/app](https://relay-ashen-zeta.vercel.app/app)
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

`RelayPolicy.sol` enforces per-recipient spend limits so the agent can only move value within bounds the user set — even though the UX is a single sentence. Every limit is per-recipient, read from storage, never a hardcoded global constant. Since recipients arrive as arbitrary addresses typed in a sentence (they can't be pre-whitelisted one by one), a recipient seen for the first time is auto-enrolled under an owner-configurable default (`defaultPerTxMaxWei` / `defaultDailyMaxWei`) rather than rejected outright — `configureRecipient` still lets the owner set a tighter or looser limit for any specific address afterward. `checkAndRecord` is called for real on every live transfer (via a ZeroDev-sponsored UserOp) and reverts — blocking the transfer — if the policy is violated.

Deployed at [`0x8DD23aBBA62f10306805F0B2C8BF8459d1C3974e`](https://sepolia.arbiscan.io/address/0x8DD23aBBA62f10306805F0B2C8BF8459d1C3974e) on Arbitrum Sepolia — `owner` is the demo deployer key, `agent` is the ZeroDev Kernel account for `RELAY_AGENT_PRIVATE_KEY`, `defaultPerTxMaxWei`/`defaultDailyMaxWei` are 100 / 500 token-units (18-decimal convention). Confirmed on-chain via direct `readContract` calls at deploy time.

> **Not yet verified on Arbiscan** — the deploy above ran without `--etherscan-api-key` (none was available in this environment). To verify:
> ```bash
> cd contracts
> forge verify-contract 0x8DD23aBBA62f10306805F0B2C8BF8459d1C3974e src/RelayPolicy.sol:RelayPolicy \
>   --chain arbitrum-sepolia \
>   --etherscan-api-key $ARBISCAN_KEY \
>   --constructor-args $(cast abi-encode "constructor(address,uint256,uint256)" 0xB44dd0f1504Bf478ebE3E05f3A0c293c7C5F0cE0 100000000000000000000 500000000000000000000)
> ```

To redeploy again later (e.g. different default limits, different agent):

```bash
# 1. Get the Kernel account address for your RELAY_AGENT_PRIVATE_KEY —
#    this is NOT the raw EOA address; msg.sender inside checkAndRecord is
#    the smart account that executes the UserOp, not the EOA that signs it.
npm run agent:address

# 2. Deploy with that address as AGENT_ADDRESS. Needs a separate funded
#    deployer key (Arbitrum Sepolia ETH from a faucet) — this is a plain
#    contract deployment, not a sponsored UserOp, so it isn't gas-free.
cd contracts
DEPLOYER_PRIVATE_KEY=0x... \
AGENT_ADDRESS=0x... \
DEFAULT_PER_TX_MAX_WEI=100000000000000000000 \
DEFAULT_DAILY_MAX_WEI=500000000000000000000 \
forge script script/Deploy.s.sol \
  --rpc-url $ARB_SEPOLIA_RPC --broadcast --verify \
  --etherscan-api-key $ARBISCAN_KEY

# 3. Update NEXT_PUBLIC_RELAY_POLICY_ADDRESS in .env.local (and the link
#    above) to the new address printed by the script.
```

`DEFAULT_PER_TX_MAX_WEI` / `DEFAULT_DAILY_MAX_WEI` follow an 18-decimal ("ether-style") convention regardless of the token actually transferred — the policy contract never moves tokens itself, it only bounds a number, so `100000000000000000000` means "100 token-units per transaction." Change them (or call `setDefaultLimits` post-deploy) to whatever bound you want new recipients to start under.

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

**RelayPolicy redeployed** with real `checkAndRecord` enforcement (auto-enrollment under owner-set default limits, blocking on violation) — covered by `contracts/test/RelayPolicy.t.sol` (9/9 passing) and confirmed live on-chain. Not yet verified on Arbiscan (no API key was available at deploy time); see "Deployed contract" for the one-line `forge verify-contract` command to finish that once you have a key.
