import type { Metadata } from "next";
import Link from "next/link";
import { HomeSearch } from "@/components/explore/HomeSearch";
import { SunsetStripeBand } from "@/components/ui/SunsetStripeBand";

export const metadata: Metadata = {
  title: "Avolo — Let's Fly Away",
  description:
    "Plan your next trip with AI. Search flights, hotels, cars, and excursions — all in one conversation.",
};

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-dvh">
      {/* Minimal marketing header */}
      <header style={{
        height: 64,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 var(--spacing-xxl)",
        backgroundColor: "var(--color-canvas)",
        borderBottom: "1px solid var(--color-hairline-soft)",
      }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "var(--spacing-xs)", textDecoration: "none" }}>
          <span
            className="material-symbols-outlined"
            style={{ color: "var(--color-primary)", fontSize: 24, fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
            aria-hidden="true"
          >
            flight_takeoff
          </span>
          <span style={{ fontFamily: "var(--font-editorial)", fontSize: 18, fontWeight: 700, color: "var(--color-ink)", letterSpacing: "-0.3px" }}>
            avolo
          </span>
        </Link>
        <Link
          href="/login"
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: "var(--color-steel)",
            textDecoration: "none",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          Sign in
        </Link>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-gutter py-section">
        <div className="w-full max-w-container-max flex flex-col gap-12">
          <div className="flex flex-col gap-4">
            <h1 className="font-editorial text-heading-1 text-ink">
              Let&apos;s Fly Away
            </h1>
            <p className="text-body-lg text-steel max-w-lg">
              Tell us where you want to go. We&apos;ll handle flights, hotels, cars,
              and excursions — ranked by AI, explained honestly.
            </p>
          </div>
          <HomeSearch />
          <div className="flex items-center gap-6 flex-wrap">
            <Link
              href="/journal"
              className="text-xs font-semibold uppercase tracking-widest text-steel hover:text-primary transition-colors"
            >
              Travel Journal
            </Link>
            <Link
              href="/trips"
              className="text-xs font-semibold uppercase tracking-widest text-steel hover:text-primary transition-colors"
            >
              My Trips
            </Link>
          </div>
        </div>
      </section>

      <SunsetStripeBand />
    </div>
  );
}
