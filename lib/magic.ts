// lib/magic.ts
// Magic embedded wallet — the login layer (wins the $500 Magic bonus).
//
// Magic produces a non-custodial EOA from an email/social login. That EOA
// address becomes the ownerAddress for the Particle Universal Account.
// No seed phrase ever shown to the user. This is the "no seed phrases" pillar.
//
// Client-side only (browser). The Magic instance must not run on the server.

import type { Signer } from "./particle";

let magicSingleton: any = null;

export async function getMagicInstance() {
  return getMagic();
}

async function getMagic() {
  if (typeof window === "undefined") {
    throw new Error("Magic can only be initialized in the browser.");
  }
  if (magicSingleton) return magicSingleton;

  const { Magic } = await import("magic-sdk");
  const key = process.env.NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY;
  if (!key) throw new Error("Magic publishable key missing. Set it for live mode.");

  // No custom network here — ZERODEV_BUNDLER_RPC is server-only and undefined
  // in the browser. Email OTP auth doesn't need an RPC; we set network for
  // signing only when getMagicSigner is called.
  magicSingleton = new Magic(key);
  return magicSingleton;
}

// Email OTP login. Returns the user's email + EOA address.
export async function loginWithEmail(email: string): Promise<{ email: string; address: string }> {
  const magic = await getMagic();
  await magic.auth.loginWithEmailOTP({ email });
  const address = await resolveAddress(magic);
  if (!address) throw new Error("Login succeeded but no wallet address returned. Try the manual check.");
  return { email, address };
}

export async function logout(): Promise<void> {
  const magic = await getMagic();
  await magic.user.logout();
}

export async function isLoggedIn(): Promise<boolean> {
  try {
    const magic = await getMagic();
    return await magic.user.isLoggedIn();
  } catch {
    return false;
  }
}

// Gets the EOA address from a Magic instance — tries getInfo() first, then
// falls back to eth_accounts since getInfo().publicAddress can be null
// immediately after OTP completes (session propagation lag).
async function resolveAddress(magic: any): Promise<string | null> {
  try {
    const info = await magic.user.getInfo();
    if (info?.publicAddress) return info.publicAddress as string;
  } catch {}
  try {
    const accounts: string[] = await magic.rpcProvider.request({ method: "eth_accounts" });
    if (accounts?.[0]) return accounts[0];
  } catch {}
  return null;
}

// Adapts the Magic provider into the Signer shape Particle's UA needs.
export async function getMagicSigner(): Promise<Signer> {
  const magic = await getMagic();
  const address = await resolveAddress(magic);
  if (!address) throw new Error("Could not read wallet address from Magic session.");

  const { BrowserProvider } = await import("ethers");
  const provider = new BrowserProvider(magic.rpcProvider as any);
  const ethSigner = await provider.getSigner();

  return {
    address,
    signMessage: async (bytes: Uint8Array) => ethSigner.signMessage(bytes),
  };
}
