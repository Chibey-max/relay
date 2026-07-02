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
  const info = await magic.user.getInfo();
  return { email, address: info.publicAddress as string };
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

// Adapts the Magic provider into the Signer shape Particle's UA needs.
export async function getMagicSigner(): Promise<Signer> {
  const magic = await getMagic();
  const info = await magic.user.getInfo();
  const address = info.publicAddress as string;

  const { BrowserProvider } = await import("ethers");
  const provider = new BrowserProvider(magic.rpcProvider as any);
  const ethSigner = await provider.getSigner();

  return {
    address,
    signMessage: async (bytes: Uint8Array) => ethSigner.signMessage(bytes),
  };
}
