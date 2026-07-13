// components/marketing/realSends.ts
// The two REAL, verified Relay sends shown across the phone mockups on
// the marketing page. Both moved between the same two wallets — the
// Magic-derived Relay wallet 0xE732457153a6dbA7C0E1b9D4B1EA1F4E090cf03E
// and recipient 0x829Ca89412Df6fe0bBC5C5d94aEf62B5b2102e63. Kept
// verbatim — these are not placeholders.

export interface RealSend {
  title: string;
  hash: string; // display form (may be truncated)
  href?: string; // Arbiscan link — omitted when the full hash can't be verified, rather than risk linking to a wrong or incomplete tx
}

export const REAL_SENDS: RealSend[] = [
  {
    title: "5.00 USDC to sarah.eth",
    hash: "0x118ff4…0dcfe",
    href: "https://arbiscan.io/tx/0x118ff441d1bb070c000b74a940ebc3637dfd3d989781321bd8ec47b22f80dcfe",
  },
  {
    title: "0.00005 ETH · EIP-7702",
    // Only the truncated form is confirmed — the full hash wasn't
    // reliably recorded (conflicting start/end fragments in source
    // notes), so this deliberately has no href rather than guessing.
    hash: "0x065631…f839e",
    href: undefined,
  },
];
