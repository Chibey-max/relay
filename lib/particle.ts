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
  // EIP-7702 authorization signing — a different digest/signing scheme
  // than signMessage above (see lib/magic.ts). Optional because it's only
  // needed for a real EIP-7702-mode transfer, and only Magic-backed
  // signers currently implement it.
  signEIP7702Authorization?: (params: {
    contractAddress: string;
    chainId: number;
    nonce?: number;
  }) => Promise<{ contractAddress: string; chainId: number; nonce: number; v: number; r: string; s: string; signature?: string }>;
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

// Temporarily wraps the browser's request transports (XHR — axios's default
// browser adapter — and fetch, as a fallback in case the bundle picks that
// adapter instead) to log the exact outgoing JSON-RPC method + params sent
// to Particle's UniversalX RPC, and the raw response body. The SDK is a
// black box internally (compiled, no request hook exposed), so this is the
// only way to see the literal wire payload instead of just the parsed
// error. Scoped to the duration of `fn()` only — restores both globals
// immediately after, success or failure, so it never affects unrelated
// requests elsewhere in the app.
async function withRequestLogging<T>(label: string, fn: () => Promise<T>): Promise<T> {
  if (typeof window === "undefined") return fn();

  const isTargetUrl = (url: string) => /particle|universal-?rpc|universalx/i.test(url);
  const logReq = (url: string, body: unknown) => {
    let parsed: any = body;
    if (typeof body === "string") {
      try {
        parsed = JSON.parse(body);
      } catch {
        /* leave as raw string */
      }
    }
    console.log(`[particle-rpc-request:${label}]`, url, {
      method: parsed?.method,
      params: parsed?.params,
    });
  };
  const logRes = (url: string, status: number, body: string) => {
    console.log(`[particle-rpc-response:${label}]`, url, "status:", status, "body:", body);
  };

  const OriginalXHR = window.XMLHttpRequest;
  class LoggingXHR extends OriginalXHR {
    private _url = "";
    open(method: string, url: string | URL, ...rest: any[]) {
      this._url = String(url);
      // @ts-ignore — forwarding open()'s variadic signature as-is
      return super.open(method, url, ...rest);
    }
    send(body?: Document | XMLHttpRequestBodyInit | null) {
      if (isTargetUrl(this._url)) {
        logReq(this._url, body);
        this.addEventListener("loadend", () => {
          logRes(this._url, this.status, this.responseText?.slice(0, 2000));
        });
      }
      return super.send(body as any);
    }
  }
  (window as any).XMLHttpRequest = LoggingXHR;

  const originalFetch = window.fetch;
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : (input as Request).url;
    if (isTargetUrl(url) && init?.body) {
      logReq(url, init.body);
      const res = await originalFetch(input, init);
      const clone = res.clone();
      clone.text().then((t) => logRes(url, res.status, t.slice(0, 2000)));
      return res;
    }
    return originalFetch(input, init);
  };

  try {
    return await fn();
  } finally {
    (window as any).XMLHttpRequest = OriginalXHR;
    window.fetch = originalFetch;
  }
}

// The payment. UA sources liquidity across chains automatically — the user
// never picks a chain or bridges. That sourcing is the magic we surface.
export async function sendUnifiedTransfer(
  ua: UniversalAccount,
  signer: Signer,
  params: { tokenAddress: string; amount: string; receiver: string }
): Promise<ExecutionResult> {
  try {
    // Particle's backend rejects a receiver/token address with any stray
    // whitespace as "Invalid parameters" (JSON-RPC -32602) — trim right
    // before the call as a last line of defense, even though lib/groq.ts
    // already trims at the source.
    const tokenAddress = params.tokenAddress.trim();
    const amount = params.amount.trim();
    const receiver = params.receiver.trim();

    // Confirm the exact values going in — chainId is hardcoded to
    // ARBITRUM_MAINNET_ONE (42161) here regardless of NEXT_PUBLIC_CHAIN_ID
    // (which is 421614/Sepolia, used only by the separate RelayPolicy/
    // ZeroDev flow) — print it explicitly rather than assuming.
    console.log("[sendUnifiedTransfer] request params:", {
      chainId: PARTICLE_CHAIN_ID.ARBITRUM_MAINNET_ONE,
      tokenAddress,
      amount,
      receiver,
      ownerAddress: signer.address,
    });

    const transaction = await withRequestLogging("createTransferTransaction", () =>
      ua.createTransferTransaction({
        token: {
          chainId: PARTICLE_CHAIN_ID.ARBITRUM_MAINNET_ONE,
          address: tokenAddress,
        },
        amount,
        receiver,
      })
    );

    const signature = await signer.signMessage(getBytes(transaction.rootHash));

    // EIP-7702 mode requires a separate authorization (delegating this EOA
    // to Particle's implementation contract) signed and attached per
    // UserOp chain — without it the backend rejects the broadcast with
    // "Invalid 7702 auth signature". Request one authorization tuple per
    // chain this transfer actually touches (transaction.userOps), sign
    // each via Magic's dedicated primitive (NOT signMessage — see
    // lib/magic.ts), and pass them as sendTransaction's 3rd argument.
    const userOps = (transaction.userOps ?? []) as any[];
    const chainIds = [...new Set(userOps.map((op) => Number(op.chainId)))];
    let authorizations: any[] = [];
    if (signer.signEIP7702Authorization && chainIds.length > 0) {
      const authTuples = await ua.getEIP7702Auth(chainIds);
      authorizations = await Promise.all(
        (authTuples as any[]).map(async (tuple) => {
          // Print the exact tuple before signing so it can be visually
          // confirmed against getEIP7702Auth's own output before
          // approving the signature prompt.
          console.log("[sendUnifiedTransfer] signing EIP-7702 authorization tuple:", {
            chainId: tuple.chainId,
            contractAddress: tuple.address,
            nonce: tuple.nonce,
          });
          const signed = await signer.signEIP7702Authorization!({
            contractAddress: tuple.address,
            chainId: tuple.chainId,
            nonce: tuple.nonce,
          });
          // Magic's `signature` field is optional in its own types — fall
          // back to constructing the standard 65-byte r+s+v encoding from
          // the separate components if it's ever absent.
          const signature =
            signed.signature ?? `${signed.r}${signed.s.slice(2)}${signed.v.toString(16).padStart(2, "0")}`;
          console.log("[sendUnifiedTransfer] signed EIP-7702 authorization:", { ...signed, signature });
          return { chainId: signed.chainId, signature };
        })
      );
    } else if (chainIds.length > 0) {
      console.warn("[sendUnifiedTransfer] signer has no signEIP7702Authorization — broadcast will likely fail with 'Invalid 7702 auth signature'.");
    }

    const result = await withRequestLogging("sendTransaction", () =>
      ua.sendTransaction(transaction, signature, authorizations)
    );

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
    // Log the full underlying error — err.message alone (e.g. "Invalid
    // parameters") doesn't say which parameter or which call (quote vs.
    // sign vs. broadcast) failed. err.code is Particle's JSON-RPC error
    // code (e.g. -32602 for invalid params, -32624 for insufficient
    // balance) and is the fastest way to tell those apart.
    console.error("[sendUnifiedTransfer] Universal transfer failed:", {
      message: err?.message,
      code: err?.code,
      stack: err?.stack,
      params: { tokenAddress: params.tokenAddress, amount: params.amount, receiver: params.receiver },
      raw: err,
    });
    const detail = err?.code ? ` (code ${err.code})` : "";
    return { ok: false, error: (err?.message ?? "Universal transfer failed") + detail };
  }
}
