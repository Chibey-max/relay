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

import {
  CHAIN_ID as PARTICLE_CHAIN_ID,
  UniversalAccount,
  type ISmartAccountOptions,
} from "@particle-network/universal-account-sdk";
import { getBytes } from "ethers";
import { SOURCE_CHAINS, type UnifiedBalance, type ExecutionResult } from "./config";

// SDK returns a numeric chainId (e.g. 42161) — the UI's balance reveal keys
// its chain-dot colors and labels off human names ("Arbitrum", "Base"), so
// map back through the same table the rest of the app uses. Falls back to
// the raw id for a chain we don't otherwise surface.
function chainName(chainId: number | string): string {
  const id = Number(chainId);
  return SOURCE_CHAINS.find((c) => c.id === id)?.name ?? String(chainId);
}

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
    // useEIP7702 is required to get an EIP-7702-delegated EOA (the UA
    // hard requirement) instead of the SDK's default separate smart
    // account — without this flag the account is NOT in 7702 mode.
    // Do NOT set name/version here: the .d.ts marks them required, but
    // the backend validates `version` against its own internal default
    // and rejects an arbitrary string with "Unsupported smart account"
    // (verified live against the Particle project — omitting them and
    // passing only useEIP7702 works; the SDK fills in its own defaults
    // for the omitted fields at runtime).
    smartAccountOptions: {
      useEIP7702: true,
    } as ISmartAccountOptions,
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
      chain: chainName(agg.token?.chainId ?? agg.chainId ?? "unknown"),
      token: String(asset.tokenType ?? asset.symbol ?? "TOKEN").toUpperCase(),
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
      chain: chainName(op.chainId ?? op.chain ?? "unknown"),
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
