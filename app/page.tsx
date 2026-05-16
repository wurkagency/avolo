import type { Metadata } from "next";
import Link from "next/link";
import { HomeSearch } from "@/components/explore/HomeSearch";

export const metadata: Metadata = {
  title: "Avolo — Let's Fly Away",
  description:
    "Plan your next trip with AI. Search flights, hotels, cars, and excursions — all in one conversation.",
};

export default function HomePage() {
  return (
    <section className="flex flex-col items-center justify-center min-h-[calc(100dvh-72px)] px-gutter py-section-padding">
      <div className="w-full max-w-container-max flex flex-col gap-12">
        {/* Hero */}
        <div className="flex flex-col gap-4">
          <h1 className="font-editorial text-heading-1 text-ink">
            Let&apos;s Fly Away
          </h1>
          <p className="text-body-lg text-steel max-w-lg">
            Tell us where you want to go. We&apos;ll handle flights, hotels, cars,
            and excursions — ranked by AI, explained honestly.
          </p>
        </div>

        {/* Destination search */}
        <HomeSearch />

        {/* Quick links */}
        <div className="flex items-center gap-6 flex-wrap">
          <Link
            href="/journal"
            className="text-xs font-semibold uppercase tracking-widest text-steel hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
          >
            Travel Journal
          </Link>
          <Link
            href="/trips"
            className="text-xs font-semibold uppercase tracking-widest text-steel hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
          >
            My Trips
          </Link>
        </div>
      </div>
    </section>
  );
}
