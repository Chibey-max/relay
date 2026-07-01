// lib/particle.ts
// Particle Universal Accounts — the STAR of Relay.
//
// This is what wins the Universal Accounts Track (30% "prominent/innovative
// use of UA + EIP-7702"). The user's EOA (from Magic) becomes a
// chain-abstracted account in place. One balance, any chain, no bridging.
//
// Call signatures here match the official quickstart:
//   new UniversalAccount({ projectId, projectClientKey, projectAppUuid, ownerAddress })
//   ua.getPrimaryAssets()              -> unified balance
//   ua.createTransferTransaction(...)  -> cross-chain transfer
//   ua.sendTransaction(tx, signature)  -> broadcast
//
// NOTE: Particle UA is migrating to V2. If getPrimaryAssets throws a
// migration error, surface it honestly in the UI (Rule 6) rather than faking.

import { CHAIN_ID as PARTICLE_CHAIN_ID, UniversalAccount } from "@particle-network/universal-account-sdk";
import { getBytes } from "ethers";
import type { UnifiedBalance, ExecutionResult } from "./config";

export interface Signer {
  address: string;
  // signMessage takes raw bytes and returns a hex signature.
  signMessage: (bytes: Uint8Array) => Promise<string>;
}

export function createUniversalAccount(ownerAddress: string): UniversalAccount {
  const projectId = process.env.NEXT_PUBLIC_PARTICLE_PROJECT_ID;
  const clientKey = process.env.NEXT_PUBLIC_PARTICLE_CLIENT_KEY;
  const appId = process.env.NEXT_PUBLIC_PARTICLE_APP_ID;

  if (!projectId || !clientKey || !appId) {
    throw new Error("Particle credentials missing. Set them in .env.local for live mode.");
  }

  return new UniversalAccount({
    projectId,
    projectClientKey: clientKey,
    projectAppUuid: appId,
    ownerAddress,
    tradeConfig: {
      slippageBps: 100, // 1%
      universalGas: true, // let the UA pay gas from any token it holds
    },
  });
}

// The unified-balance reveal. This is the hero data point for the demo:
// "you have $X across N chains, spendable as one."
export async function getUnifiedBalance(ua: UniversalAccount): Promise<UnifiedBalance> {
  const assets = await ua.getPrimaryAssets();
  const perChain = (assets.assets ?? []).flatMap((asset: any) =>
    (asset.chainAggregation ?? []).map((agg: any) => ({
      chain: String(agg.token?.chainId ?? agg.chainId ?? "unknown"),
      token: asset.tokenType ?? asset.symbol ?? "TOKEN",
      amount: String(agg.amount ?? "0"),
      usd: String(agg.amountInUSD ?? "0"),
    }))
  );
  return {
    totalUsd: String(assets.totalAmountInUSD ?? "0"),
    perChain,
  };
}

// The payment. UA sources liquidity across chains automatically — the user
// never picks a chain or bridges. That sourcing is the magic we surface.
export async function sendUnifiedTransfer(
  ua: UniversalAccount,
  signer: Signer,
  params: { tokenAddress: string; amount: string; receiver: string }
): Promise<ExecutionResult> {
  try {
    const transaction = await ua.createTransferTransaction({
      token: {
        chainId: PARTICLE_CHAIN_ID.ARBITRUM_MAINNET_ONE,
        address: params.tokenAddress,
      },
      amount: params.amount,
      receiver: params.receiver,
    });

    const signature = await signer.signMessage(getBytes(transaction.rootHash));
    const result = await ua.sendTransaction(transaction, signature);

    // The UA tells us which chains it pulled liquidity from via the per-chain
    // UserOps — that's the cross-chain sourcing story we surface in the UI.
    const sourcedFrom = (transaction.userOps ?? []).map((op: any) => ({
      chain: String(op.chainId ?? op.chain ?? "unknown"),
      amount: String(transaction.totalDepositTokenAmountInUSD ?? ""),
    }));

    return {
      ok: true,
      transactionId: result.transactionId,
      explorerUrl: `https://universalx.app/activity/details?id=${result.transactionId}`,
      sourcedFrom,
    };
  } catch (err: any) {
    return { ok: false, error: err?.message ?? "Universal transfer failed" };
  }
}
