import { NextRequest, NextResponse } from "next/server";
import { RELAY_MODE } from "../../../lib/config";
import type { Address } from "viem";

const DEMO_SRA = "0x5AA0000000000000000000000000000000000001";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { ownerAddress } = body;
  const mode = body.mode ?? RELAY_MODE;

  if (mode === "demo") {
    return NextResponse.json({
      mode: "demo",
      smartRoutingAddress: DEMO_SRA,
      destChain: "Arbitrum Sepolia",
      note: "Demo deposit address — switch to live mode for a real SRA.",
    });
  }

  if (!ownerAddress) {
    return NextResponse.json({ error: "ownerAddress required" }, { status: 400 });
  }

  try {
    const { createRelayDepositAddress } = await import("../../../lib/zerodev-sra");
    const result = await createRelayDepositAddress(ownerAddress as Address);
    return NextResponse.json({ mode: "live", ...result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Failed to create Smart Routing Address" },
      { status: 502 }
    );
  }
}
