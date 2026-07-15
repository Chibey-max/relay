import type { Metadata } from "next";
import { Fraunces, Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});
const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600"],
});
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Relay: Money that moves the way you speak",
  description:
    "Relay reads a sentence, finds your funds across every chain, and sends: no gas, no bridging, no seed phrase. Powered by Particle Universal Accounts in EIP-7702 mode.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${sans.variable} ${mono.variable}`}
    >
      <head>
        {/**
         * A raw <link>, not next/font/google: this is a variable icon
         * font (Material Symbols), not body text, and next/font's
         * per-weight subsetting model does not fit an opsz/wght/FILL/GRAD
         * variable axis font like this one.
         */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20,400,0,0&display=optional"
        />
      </head>
      <body className="font-sans bg-ink text-chalk antialiased">
        {children}
      </body>
    </html>
  );
}
