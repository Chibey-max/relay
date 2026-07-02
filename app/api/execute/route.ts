// app/api/execute/route.ts
// Validates a transfer intent.
//
// DEMO mode: returns a clearly-labelled demo result (no real tx).
// LIVE mode: fires a ZeroDev-sponsored UserOp (gas sponsorship proof),
// then hands the client what it needs to broadcast via Particle UA.
// The actual Particle transfer is signed and broadcast client-side
// because Magic + the signer live in the browser.

import { NextRequest, NextResponse } from "next/server";
import { RELAY_MODE, RELAY_POLICY_ADDRESS } from "../../../lib/config";
import { DEMO_EXECUTION } from "../../../constants/demo";
import type { Address } from "viem";

// Mainnet USDC addresses per chain (Particle UA is mainnet-only)
const TOKEN_ADDRESSES: Record<string, string> = {
  USDC: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", // Arbitrum mainnet
  USDT: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9", // Arbitrum mainnet
  ETH:  "0x0000000000000000000000000000000000000000", // native
};

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { intent } = body;
  const mode = body.mode ?? RELAY_MODE;

  if (!intent || intent.action !== "transfer") {
    return NextResponse.json({ ok: false, error: "Not a transfer intent." }, { status: 400 });
  }
  if (!intent.recipient) {
    return NextResponse.json(
      { ok: false, error: "No recipient found. Try: \"send 5 USDC to 0x...\"" },
      { status: 400 }
    );
  }
  if (!intent.amount) {
    return NextResponse.json(
      { ok: false, error: "No amount found. Try: \"send 5 USDC to 0x...\"" },
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

  if (mode === "demo") {
    return NextResponse.json({ mode: "demo", ...DEMO_EXECUTION });
  }

  // Live mode: fire ZeroDev sponsored check, then tell the client to proceed.
  let userOpHash: string | undefined;
  let agentAddress: string | undefined;
  let zdError: string | undefined;

  try {
    const { sendSponsoredCheck } = await import("../../../lib/zerodev");
    const zdResult = await sendSponsoredCheck({
      recipient: intent.recipient as Address,
      policyAddress: RELAY_POLICY_ADDRESS as Address,
    });
    if (zdResult.ok) {
      userOpHash = zdResult.userOpHash;
      agentAddress = zdResult.agentAddress;
    } else {
      zdError = zdResult.error;
    }
  } catch (err: any) {
    // ZeroDev failure is non-blocking — log it but let the transfer proceed
    zdError = err?.message ?? "ZeroDev check failed";
  }

  return NextResponse.json({
    mode: "live",
    ready: true,
    tokenAddress,
    amount: intent.amount,
    receiver: intent.recipient,
    // ZeroDev proof — present even if null so the UI can surface it
    userOpHash: userOpHash ?? null,
    agentAddress: agentAddress ?? null,
    zdError: zdError ?? null,
  });
}
