import type { Metadata, Viewport } from "next";
import { Fraunces, Outfit, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const serif = Fraunces({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const sans = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://mankind-simonellefsens-projects.vercel.app"),
  title: "MANKIND — a deep-time atlas",
  description:
    "How Homo sapiens spread from Africa, how Neanderthals, Denisovans and island humans lived beside us, and how ice ages redrew the map.",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "MANKIND — a deep-time atlas",
    description:
      "An interactive globe of human origins, ice, drowned continents, and the cousins we met along the way.",
    images: [{ url: "/images/globe_render.png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#05060a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
