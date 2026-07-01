import { createSmartRoutingAddress } from "@zerodev/smart-routing-address";
import { type Address } from "viem";
import { arbitrumSepolia, baseSepolia, sepolia } from "viem/chains";

export interface SRAResult {
  smartRoutingAddress: Address;
  destChain: string;
  note: string;
}

export async function createRelayDepositAddress(ownerAddress: Address): Promise<SRAResult> {
  const { smartRoutingAddress } = await createSmartRoutingAddress({
    owner: ownerAddress,
    destChain: arbitrumSepolia,
    slippage: 100,
    allowPartialRoutes: true,
    srcTokens: [
      { tokenType: "USDC", chain: baseSepolia },
      { tokenType: "NATIVE", chain: baseSepolia },
      { tokenType: "USDC", chain: sepolia },
    ],
    actions: {
      USDC: { action: [], fallBack: [] },
      NATIVE: { action: [], fallBack: [] },
    },
  });
  return {
    smartRoutingAddress,
    destChain: "Arbitrum Sepolia",
    note: "Send USDC or ETH on Base Sepolia or Sepolia — arrives on Arbitrum Sepolia automatically.",
  };
}
