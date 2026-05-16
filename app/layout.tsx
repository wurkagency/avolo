import type { Metadata } from "next";
import { Playfair_Display, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { TopBar } from "@/components/nav/TopBar";
import { MobileMenu } from "@/components/nav/MobileMenu";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { NextAuthProvider } from "@/components/providers/NextAuthProvider";
import { SunsetStripeBand } from "@/components/ui/SunsetStripeBand";

const editorial = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-editorial",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Avolo — AI Travel Planner",
    template: "%s | Avolo",
  },
  description:
    "AI-first travel planning. Find the best flights, hotels, cars, and excursions — explained and ranked for you.",
  metadataBase: new URL(process.env.SITE_URL ?? "https://www.avolo.app"),
  openGraph: {
    type: "website",
    siteName: "Avolo",
    locale: "en_US",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${editorial.variable} ${inter.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
        />
      </head>
      <body className="text-ink bg-surface min-h-dvh flex flex-col" style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}>
        <NextAuthProvider>
          <QueryProvider>
            <TopBar />
            <MobileMenu />
            <main className="flex-1 pt-[72px]">{children}</main>
            <SunsetStripeBand />
            <ToastProvider />
          </QueryProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}
