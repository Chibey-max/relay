// lib/zerodev.ts
// ZeroDev — gas sponsorship in EIP-7702 mode (wins the $500 ZeroDev subtrack).
//
// Role in Relay: the "no accounting for gas" pillar. For a direct
// Arbitrum-local action, the agent sends a sponsored UserOp so the user pays
// zero gas. The EOA is upgraded in place via 7702 — no new address.
//
// The ZeroDev SDK + viem expose deeply-generic types that fight strict TS at
// the call seam, so we keep this module's SDK boundary loosely typed on
// purpose and expose a clean, strict interface to the rest of the app.

import {
  createKernelAccount,
  createKernelAccountClient,
  createZeroDevPaymasterClient,
} from "@zerodev/sdk";
import { KERNEL_V3_3, getEntryPoint } from "@zerodev/sdk/constants";
import { http, createPublicClient, type Address, type Hex } from "viem";
import { arbitrumSepolia } from "viem/chains";

export interface GaslessResult {
  ok: boolean;
  userOpHash?: string;
  txHash?: string;
  error?: string;
}

/**
 * Send a gas-sponsored UserOp from an EIP-7702-upgraded EOA.
 * @param localAccount a viem LocalAccount that supports signAuthorization
 * @param call         the single call to execute
 */
export async function sendSponsoredUserOp(
  localAccount: any,
  call: { to: Address; value: bigint; data: Hex }
): Promise<GaslessResult> {
  try {
    const bundlerRpc = process.env.ZERODEV_BUNDLER_RPC;
    const paymasterRpc = process.env.ZERODEV_PAYMASTER_RPC;
    if (!bundlerRpc || !paymasterRpc) {
      throw new Error("ZeroDev RPC URLs missing. Set them for live mode.");
    }

    const entryPoint = getEntryPoint("0.7");
    const publicClient: any = createPublicClient({
      chain: arbitrumSepolia,
      transport: http(bundlerRpc),
    });

    // EIP-7702 authorization: upgrade the EOA in place, no new address.
    const authorization = await localAccount.signAuthorization({
      chainId: arbitrumSepolia.id,
      nonce: 0,
    });

    const account: any = await createKernelAccount(publicClient, {
      eip7702Account: localAccount,
      entryPoint,
      kernelVersion: KERNEL_V3_3,
      eip7702Auth: authorization,
    });

    const paymaster: any = createZeroDevPaymasterClient({
      chain: arbitrumSepolia,
      transport: http(paymasterRpc),
    });

    const kernelClient: any = createKernelAccountClient({
      account,
      chain: arbitrumSepolia,
      bundlerTransport: http(bundlerRpc),
      paymaster: {
        getPaymasterData: (userOperation: any) =>
          paymaster.sponsorUserOperation({ userOperation }),
      },
      client: publicClient,
    });

    const callData = await account.encodeCalls([
      { to: call.to, value: call.value, data: call.data },
    ]);

    const userOpHash: string = await kernelClient.sendUserOperation({ callData });
    const receipt = await kernelClient.waitForUserOperationReceipt({ hash: userOpHash });

    return {
      ok: true,
      userOpHash,
      txHash: receipt?.receipt?.transactionHash,
    };
  } catch (err: any) {
    return { ok: false, error: err?.message ?? "Sponsored UserOp failed" };
  }
}
