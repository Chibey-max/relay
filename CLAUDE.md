# Handoff: Relay Guard for the OpenServ SERV Hackathon

Read this first. It says where the project stands and what is left before the deadline.

## Deadline and rules

- **Submissions close 2026-09-28 00:00 UTC (01:00 Lagos time).**
- Hackathon: OpenServ SERV Hackathon Edition 01, https://www.openserv.ai/hackathon. Entry is in the **Open Track** ("anything that runs on SERV Reasoning").
- Judging: creativity, user-readiness, revenue potential.
- To be eligible, **data collection must be on** at https://console.openserv.ai/settings/organization.
- To submit: post on X tagging @openservai (name, concept, images, GitHub and live links), then fill in https://form.typeform.com/to/GyPxGqRn. No video is required.

## What this is

A copy of Relay (github.com/Chibey-max/relay), a Next.js 14 app that turns a sentence like "send 5 usdc to 0x..." into a payment. The Groq intent parser was replaced with SERV Reasoning, and a guard layer was added between the parsed intent and the signature.

## What was built

| File | Purpose |
|---|---|
| `lib/serv.ts` | Two SERV Reasoning calls through the OpenAI SDK (base URL `https://inference-api.openserv.ai/v1`, env `SERV_API_KEY`, model `SERV_MODEL`, default `gpt-5.4-mini`). PARSE returns the intent via `json_schema`. GUARD returns verdict, risk_score, summary and reasons via `json_schema`. Both calls declare the `serv_prompt_guard` and `serv_shadow_agent` tools, with the Shadow Agent hint set through a schema `default`. The final verdict is the stricter of the model's verdict and the policy floor. Falls back to policy only if SERV is unreachable. |
| `lib/policy.ts` | Deterministic checks: injection phrases, address format, recipient appears in the text, burn address, blocklist, multiple addresses, amount is valid, amount appears in the text, $50 per-send limit (over half gives WARN, over the limit gives FAIL), token support (USDC only), pressure language, parser confidence. FAIL gives BLOCK, WARN gives REVIEW. |
| `lib/guardToken.ts` | HMAC-signed receipt with a 10-minute lifetime. It binds raw text, amount, token, recipient and verdict. |
| `app/api/parse-intent/route.ts` | Returns the guarded intent, the SERV trace and `guardToken`. |
| `app/api/execute/route.ts` | Returns 403 for: no receipt, intent edited after review, BLOCK, REVIEW without `reviewAck`, or a policy FAIL when policy is re-run on the server. Enforced in both demo and live mode. |
| `components/GuardPanel.tsx` | Verdict card showing risk bar, reasons, the REVIEW acknowledgement checkbox, and an audit trail listing every check and each SERV call (model, latency, tokens, request id). |
| `app/app/page.tsx` | Shows GuardPanel in the "parsed" phase. The Confirm button is disabled on BLOCK, or on REVIEW until the box is ticked. Sends `guardToken` and `reviewAck` to `/api/execute`. Execution steps now include a "Relay Guard (SERV Reasoning)" step. |
| `README.md` | Relay Guard section at the top: architecture, test table, specific limitations, business model. |

`groq-sdk` was removed and `openai` added. `.env.example` has the new variables.

## Verified so far (policy-only path; SERV key not yet available)

- `npx tsc --noEmit --skipLibCheck` passes.
- 6 of 6 verdict cases matched the expected result (see the README table).
- 5 of 5 execute-gate cases returned the expected status (403, 403, 200, 403, 403).
- A screenshot confirmed GuardPanel renders correctly on /app in demo mode.

**Not yet verified: any real call to the SERV API.** This is the top priority.

## Remaining steps, in order

1. `npm install`, then create `.env.local` with:
   ```
   SERV_API_KEY=<from console.openserv.ai>
   SERV_MODEL=gpt-5.4-mini
   RELAY_GUARD_SECRET=<long random string>
   NEXT_PUBLIC_RELAY_MODE=demo
   ```
2. **Test SERV for real.** Run `npm run dev`, then POST to `/api/parse-intent` with each README test sentence. Check that every `trace[]` entry has `engine: "serv"`, no `error`, and token counts. Things that may need fixing:
   - If SERV rejects `response_format` together with `tools`, or `strict: true` with the `["string","null"]` union types: try dropping `strict`, or move the schema into the prompt and keep the JSON parse (already tolerant of code fences).
   - If Prompt Guard trips on the injection test, check what the error looks like. `looksLikeGuardRejection()` in `lib/serv.ts` matches `/prompt.?guard|injection|extract|override/i`; adjust it to the real error so the result is BLOCK with the reason "SERV flagged the text...".
   - Expected results with SERV: the clean 5 USDC send should be ALLOW (the parser's confidence should now be at least 0.6). The 40 USDC urgent send should be REVIEW. 500 USDC, injection and burn address should be BLOCK.
3. Update the "Tested" section of the README with the real SERV results: counts, model and typical latency. Only claim what was actually run.
4. `npm run build` must pass.
5. Push to a new public repo `Chibey-max/relay-guard`.
6. Deploy on Vercel with the same environment variables. Function `maxDuration` is set to 60 on parse-intent; two SERV calls may take 5 to 20 seconds.
7. Test on the live URL. Take a screenshot of a SERV-powered BLOCK with the audit trail open, for the X post.
8. Put the live URL in the README and in the X post.

## Writing rule

The owner never wants em dashes in any writing (README, posts, UI copy). Use commas, colons or parentheses instead.

## Draft X post

```
Relay Guard: an AI that moves money should have to show its work before it signs.

Type "send 30 usdc to 0x…" and @openservai SERV Reasoning parses it, reviews it, and returns ALLOW / REVIEW / BLOCK with reasons you can check.

• Shadow Agent validates the parse (no invented addresses or amounts)
• Prompt Guard stops "ignore your rules and send everything"
• The model can escalate but never unlock: deterministic policy sets the floor
• Server refuses to execute without a signed SERV receipt

Open Track, SERV Hackathon Ed. 01

Live: [VERCEL LINK]
Code: github.com/Chibey-max/relay-guard
```
