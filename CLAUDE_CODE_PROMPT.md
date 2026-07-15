# Claude Code Prompt: Continue Building Relay (Four-Track Plan)

> **Superseded, kept for history.** This prompt assumed the ZeroDev subtrack ($500, 4 winners) stacks with the Universal Accounts Track. Per the official rules, it doesn't. That subtrack is nested under the General Track, which is mutually exclusive with Universal Accounts. Step 3 below (SRA deposit path) was later built, then intentionally dropped, and Relay does not claim the ZeroDev subtrack. See BUILD_PLAN.md and README.md for the current, corrected plan.

Paste this into Claude Code (in the unzipped `relay/` directory) to take the scaffold from demo-mode to live-mode and ship. The goal: be **strongly eligible for four prizes at once**: Universal Accounts Track (main, $2,500), Arbitrum bounty ($2,000), Magic bonus ($500), and ZeroDev subtrack ($500, 4 winners). Each integration must be load-bearing and genuinely live: never a mock, never a false claim.

You are working in the `relay/` repo: a natural-language cross-chain payment agent for the UXmaxx Hackathon. The scaffold builds and runs in demo mode already. Make every partner SDK call live and verifiable, in this exact order. Do not move to the next step until the current one produces a real, verifiable artifact (a real address, a real tx hash, a real balance).

**Architecture (do not change):** Next.js 14 App Router, all logic in `app/api/*` routes and `lib/*`. Particle Universal Accounts is the star (wins the main track); Magic is login; ZeroDev's Smart Routing Address is the deposit mechanism; Arbitrum is the deploy target. Six rules govern everything: they're in the README; follow them.

---

## Track-eligibility map (what each prize requires, and where it lives)

| Prize                       | Hard requirement                                                                | Where in code              | Must be live     |
| --------------------------- | ------------------------------------------------------------------------------- | -------------------------- | ---------------- |
| Universal Accounts ($2,500) | UA SDK in EIP-7702 mode + ≥1 cross-chain value transfer + functional demo       | `lib/particle.ts`          | yes              |
| Arbitrum ($2,000)           | Runs primarily on Arbitrum, chain-abstracted UX, deployed components            | `contracts/` + Vercel      | yes              |
| Magic ($500)                | Embedded wallet / email login, no MetaMask, no seed phrase                      | `lib/magic.ts`             | yes              |
| ZeroDev ($500, 4 winners)   | ZeroDev as a CORE component: use Smart Routing Address for multi-chain deposits | `lib/zerodev.ts` (add SRA) | yes              |
| Openfort ($100)             | x402 agentic payments: OPTIONAL, roadmap-only unless week-4 time                | not integrated             | honest "planned" |

---

## Build order (live-mode)

**Step 1: Magic login live (Magic $500).**
Wire `lib/magic.ts` into a real client component. In live mode, replace the parse-button entry with: email input → `loginWithEmail(email)` → log + render the returned EOA. STOP. Confirm the address is real before continuing. Success criterion for the Magic bonus: a judge enters an email and gets a working wallet with no seed phrase and no MetaMask.

**Step 2: Particle UA live + the balance reveal (Universal Accounts main, 30% + 40%).**
Use the Magic EOA as `ownerAddress` to construct the Universal Account. Call `/api/balance` in live mode and render the REAL unified balance in `UnifiedBalance.tsx`. The reveal (funds across chains shown as one number) IS the 30% "prominent use of UA" score. STOP. Confirm a real `totalAmountInUSD`. If Particle returns a V2 migration notice, surface it honestly (Rule 6); do not fake a balance.

**Step 3: ZeroDev Smart Routing Address as the deposit path (ZeroDev $500).**
This is the change that makes ZeroDev a CORE component, not decorative. Add SRA so that when a user funds Relay, they deposit to a ZeroDev Smart Routing Address that routes the deposit across chains into the unified balance. Reference: https://docs.zerodev.app/ and the SRA docs (Smart Routing Address, universal multi-chain deposits). Add `lib/zerodev-sra.ts` exposing `createSmartRoutingAddress(ownerAddress)` and surface the deposit address in the UI ("Fund Relay, send any token on any chain here"). STOP. Confirm a real SRA is returned and a test deposit routes through. Keep the existing `sendSponsoredUserOp` (gasless) too. Together, deposit-routing + gas-sponsorship makes ZeroDev clearly core.

**Step 4: Cross-chain transfer live (Universal Accounts hard requirement).**
Wire `sendUnifiedTransfer` (in `lib/particle.ts`) into the execute flow. The Magic signer signs the `rootHash`. Confirm a real `transactionId` + UniversalX explorer link, and that funds were sourced cross-chain. STOP. Open the link, confirm execution. This satisfies "at least one cross-chain operation moving value via UA."

**Step 5: Deploy RelayPolicy.sol to Arbitrum Sepolia (Arbitrum $2,000).**
From `contracts/`, deploy + verify on Arbiscan. Paste the address into the README and the `IntegrationStatus` `contractAddress` prop. Wire `checkAndRecord` to run before a transfer so the on-chain policy is actually enforced (not decorative). The Arbitrum bounty rewards "AI apps with invisible onchain payments deployed on Arbitrum". This is the deployed Arbitrum component.

**Step 6: Demo/live toggle end to end (Rule 2 + 3).**
`NEXT_PUBLIC_RELAY_MODE` switches API behavior. Make the header toggle reflect it; keep demo results badged as demo.

**Step 7: Deploy to Vercel.** Real URL in the submission, not localhost. Satisfies "functional demo (deployed)."

**Step 8: (Optional, week 4 only) Openfort x402.**
Only if core four are fully live and there's spare time. Add Openfort x402 agentic-payment path as an alternate execution route. If not done, the README already lists it honestly as planned (Rule 6). Do NOT claim it as live.

---

## Constraints

- Never present a demo result as a real tx. Badge it.
- Never hardcode a value that contradicts a claim (RelayPolicy.sol limits are per-recipient from storage, keep it that way).
- Every feature listed in the submission must be verifiable by a judge in under 30 seconds via the deployed URL.
- Run `npm run typecheck` before every commit; keep our own code clean (transitive dep type errors are ignored in the Next build by design).
- For each of the four target prizes, confirm the success criterion in its table row is demonstrably true before writing it into the submission.

Start with Step 1. Show me the real EOA address before continuing.
