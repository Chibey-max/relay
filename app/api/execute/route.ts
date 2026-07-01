// app/api/execute/route.ts
// Executes a parsed transfer intent.
//
// DEMO mode: returns a clearly-labelled demo result (no real tx).
// LIVE mode: the heavy lifting (Magic signing, UA transfer) happens
// CLIENT-side because Magic + the signer live in the browser. This route
// validates the intent and returns the token address mapping the client
// needs. The actual broadcast is done client-side via lib/particle.ts.

import { NextRequest, NextResponse } from "next/server";
import { RELAY_MODE } from "../../../lib/config";
import { DEMO_EXECUTION } from "../../../constants/demo";

// Minimal token registry for the demo/testnet. Extend as needed.
const TOKEN_ADDRESSES: Record<string, string> = {
  // Arbitrum USDC (mainnet address used by Particle UA routing layer)
  USDC: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
  USDT: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
};

export async function POST(req: NextRequest) {
  const { intent } = await req.json();

  if (!intent || intent.action !== "transfer") {
    return NextResponse.json({ ok: false, error: "Not a transfer intent." }, { status: 400 });
  }
  if (!intent.recipient) {
    return NextResponse.json(
      { ok: false, error: "No recipient found. Try: \"send 5 USDC to 0x...\"" },
      { status: 400 }
    );
  }

  const token = (intent.token ?? "USDC").toUpperCase();
  const tokenAddress = TOKEN_ADDRESSES[token];
  if (!tokenAddress) {
    return NextResponse.json(
      { ok: false, error: `Token ${token} not supported yet. Try USDC or USDT.` },
      { status: 400 }
    );
  }

  if (RELAY_MODE === "demo") {
    return NextResponse.json({ mode: "demo", ...DEMO_EXECUTION });
  }

  // Live mode: hand the client what it needs to broadcast via the UA.
  return NextResponse.json({
    mode: "live",
    ready: true,
    tokenAddress,
    amount: intent.amount,
    receiver: intent.recipient,
  });
}
