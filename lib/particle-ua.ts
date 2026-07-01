// lib/particle-ua.ts
// Adapter: wraps lib/particle.ts for the page's live-execute flow.
// Creates the UA from the signer address, resolves the token, and dispatches.

import { createUniversalAccount, sendUnifiedTransfer as _send } from "./particle";
import type { Signer } from "./particle";
import type { ExecutionResult } from "./config";

// USDC on Arbitrum Sepolia
const USDC_ARB_SEPOLIA = "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d";

interface TransferParams {
  signer: Signer;
  to: string;
  amount: string;
  token: string;
  contractAddress?: string;
}

export async function sendUnifiedTransfer(params: TransferParams): Promise<ExecutionResult> {
  const ua = createUniversalAccount(params.signer.address);
  const tokenAddress = params.token.toUpperCase() === "USDC" ? USDC_ARB_SEPOLIA : USDC_ARB_SEPOLIA;
  return _send(ua, params.signer, {
    tokenAddress,
    amount: params.amount,
    receiver: params.to,
  });
}
