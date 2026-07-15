// lib/groq.ts
/**
 * Natural-language -> structured payment intent.
 * This is the "speakable" layer. It does NOT touch chains or keys.
 * It only extracts what the user wants so the UA layer can fulfill it.
 */

import { Groq } from "groq-sdk";
import type { ParsedIntent } from "./config";

const SYSTEM_PROMPT = `You are Relay's intent parser. You convert a user's plain-English payment request into strict JSON.

Return ONLY a JSON object, no prose, no markdown fences. Shape:
{
  "action": "transfer" | "balance" | "unknown",
  "amount": string | null,      // numeric string only, e.g. "5" or "0.1"
  "token": string | null,       // uppercase symbol, e.g. "USDC", "ETH", "USDT"
  "recipient": string | null,   // 0x address or ENS name, exactly as written
  "confidence": number          // 0 to 1
}

Rules:
- "send 5 usdc to 0xABC" -> action transfer, amount "5", token "USDC", recipient "0xABC".
- "what's my balance" / "how much do I have" -> action balance, amount null, token null, recipient null.
- If you cannot find a recipient for a transfer, still return action "transfer" with recipient null and lower confidence.
- Never invent an address. If none is present, recipient is null.
- Default token to "USDC" only if an amount is present but no token is named.`;

/**
 * Tried in order. GROQ_API_KEY_2 is an optional second key (e.g. a
 * separate account) so a rate-limited or dead primary key doesn't take
 * the whole parser down with it.
 */
const API_KEYS = [process.env.GROQ_API_KEY, process.env.GROQ_API_KEY_2].filter(
  (k): k is string => !!k
);

export async function parseIntent(text: string): Promise<ParsedIntent> {
  /**
   * Graceful fallback so the app is never dead without a key:
   * a tiny rule-based parser covers the demo script.
   */
  if (API_KEYS.length === 0) return ruleBasedFallback(text);

  for (const apiKey of API_KEYS) {
    try {
      const groq = new Groq({ apiKey });
      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        temperature: 0,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: text },
        ],
      });

      const rawOut = completion.choices[0]?.message?.content ?? "";
      const cleaned = rawOut.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      return {
        action: parsed.action ?? "unknown",
        /**
         * Groq's JSON output occasionally pads string fields with stray
         * whitespace/newlines. This is harmless for display, but Particle
         * UA's backend rejects a receiver/amount with any extra characters
         * as "Invalid parameters" (JSON-RPC -32602). Trim defensively here,
         * at the source, rather than downstream at every call site.
         */
        amount:
          typeof parsed.amount === "string"
            ? parsed.amount.trim()
            : (parsed.amount ?? null),
        token:
          typeof parsed.token === "string"
            ? parsed.token.trim()
            : (parsed.token ?? null),
        recipient:
          typeof parsed.recipient === "string"
            ? parsed.recipient.trim()
            : (parsed.recipient ?? null),
        confidence:
          typeof parsed.confidence === "number" ? parsed.confidence : 0.5,
        raw: text,
      };
    } catch (err) {
      /**
       * Could be a bad/rate-limited key or a malformed model response.
       * Either way, move on to the next key rather than dying here.
       */
      console.error(
        "[parseIntent] Groq key failed, trying next if available:",
        err
      );
    }
  }

  // Every configured key failed (or produced unparseable output).
  return ruleBasedFallback(text);
}

// Deterministic backup. Keeps the demo alive if Groq is unreachable.
function ruleBasedFallback(text: string): ParsedIntent {
  const lower = text.toLowerCase();
  if (/(balance|how much|what do i have)/.test(lower)) {
    return {
      action: "balance",
      amount: null,
      token: null,
      recipient: null,
      confidence: 0.4,
      raw: text,
    };
  }
  const amount = text.match(/(\d+(?:\.\d+)?)/)?.[1] ?? null;
  const token =
    text.match(/\b(usdc|usdt|eth|dai|weth)\b/i)?.[1]?.toUpperCase() ??
    (amount ? "USDC" : null);
  const recipient =
    text.match(/(0x[a-fA-F0-9]{40})/)?.[1] ??
    text.match(/([a-z0-9-]+\.eth)/i)?.[1] ??
    null;
  return {
    action: amount ? "transfer" : "unknown",
    amount,
    token,
    recipient,
    confidence: 0.3,
    raw: text,
  };
}
