// /trip/[id] — Trip detail page (server component)
// Fetches trip + cached results from DB and renders them statically.
// RefreshPricesButton is client-side; it calls router.refresh() on success
// to trigger a server re-render with fresh data.

import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/server/auth";
import { cookies } from "next/headers";
import { getTripById, getCachedResults } from "@/server/services/tripService";
import { toSlug } from "@/server/services/journalService";
import { RefreshPricesButton } from "@/components/trips/RefreshPricesButton";
import { CategorySection } from "@/components/results/CategorySection";
import { formatDate } from "@/lib/utils/formatDate";
import { formatEur } from "@/lib/utils/formatPrice";
import { formatRelativeTime } from "@/lib/utils/formatRelativeTime";
import type { NormalizedResult } from "@/types/search";
import type { ServiceType } from "@/types/trip";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { id: string };
}

const SERVICE_ORDER: ServiceType[] = ["FLIGHT", "HOTEL", "CAR", "EXCURSION"];

export default async function TripDetailPage({ params }: PageProps) {
  const session = await auth();
  const userId = session?.user?.id;
  const cookieStore = cookies();
  const anonId = cookieStore.get("avolo_sid")?.value;

  if (!userId && !anonId) {
    notFound();
  }

  const trip = await getTripById(params.id, { userId, anonId });
  if (!trip) notFound();

  const { rows: cachedRows } = await getCachedResults(params.id);
  const resultsByType = cachedRows.reduce<Partial<Record<ServiceType, NormalizedResult[]>>>(
    (acc, row) => {
      const type = row.serviceType as ServiceType;
      const result = row.normalizedData as unknown as NormalizedResult;
      return { ...acc, [type]: [...(acc[type] ?? []), result] };
    },
    {},
  );

  const serviceTypes = trip.services.map((s) => s.type as ServiceType);
  const hasResults = cachedRows.length > 0;

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link
          href="/trips"
          className="flex items-center gap-1 text-sm text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <span className="material-symbols-outlined text-base" aria-hidden="true">arrow_back</span>
          My Trips
        </Link>
      </div>

      {/* Trip header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-10">
        <div>
          <h1
            className="text-3xl font-bold text-on-surface"
            style={{ fontFamily: "var(--font-manrope)" }}
          >
            {trip.departureName} → {trip.destinationName}
          </h1>
          <p className="text-on-surface-variant mt-1 text-sm">
            {formatDate(trip.departureDate.toISOString())}
            {trip.returnDate
              ? ` – ${formatDate(trip.returnDate.toISOString())}`
              : " (one-way)"}
            {" · "}
            {trip.adults} adult{trip.adults !== 1 ? "s" : ""}
          </p>

          {trip.totalPriceEur !== null && (
            <p className="mt-3">
              <span className="text-3xl font-bold text-primary">{formatEur(trip.totalPriceEur)}</span>
              <span className="text-sm text-on-surface-variant ml-2">estimated total</span>
            </p>
          )}

          {trip.lastRefreshedAt && (
            <p className="text-xs text-on-surface-variant mt-1">
              Last refreshed {formatRelativeTime(trip.lastRefreshedAt)}
            </p>
          )}
        </div>

        {(trip.status === "COMPLETE" || trip.status === "STALE") && (
          <RefreshPricesButton tripId={params.id} variant="detail" />
        )}

        {trip.status === "SEARCHING" && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            Searching…
          </span>
        )}
      </div>

      {/* Travel Guide CTA */}
      <Link
        href={`/journal/${toSlug(trip.destination, trip.destinationName)}?destination=${encodeURIComponent(trip.destinationName)}&iata=${encodeURIComponent(trip.destination)}`}
        className="flex items-center justify-between gap-4 rounded-2xl border border-outline-variant bg-surface p-5 mb-8 hover:border-primary/40 hover:shadow-sm transition-all group"
      >
        <div className="flex items-center gap-3">
          <span
            className="material-symbols-outlined text-primary"
            aria-hidden="true"
            style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
          >
            auto_stories
          </span>
          <div>
            <p className="text-sm font-semibold text-on-surface group-hover:text-primary transition-colors">
              {trip.destinationName} Travel Guide
            </p>
            <p className="text-xs text-on-surface-variant mt-0.5">
              AI-generated tips on transport, car rentals, local gems, and hidden fees.
            </p>
          </div>
        </div>
        <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors shrink-0" aria-hidden="true">
          chevron_right
        </span>
      </Link>

      {/* Results */}
      {!hasResults ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <span
            className="material-symbols-outlined text-on-surface-variant"
            style={{ fontSize: "48px", fontVariationSettings: "'FILL' 0, 'wght' 200" }}
          >
            search_off
          </span>
          <div>
            <p className="font-medium text-on-surface">No results yet</p>
            <p className="text-sm text-on-surface-variant mt-1">
              {trip.status === "COMPLETE" || trip.status === "STALE"
                ? "Try refreshing prices to fetch the latest options."
                : "Search is in progress — results will appear shortly."}
            </p>
          </div>
          {(trip.status === "COMPLETE" || trip.status === "STALE") && (
            <RefreshPricesButton tripId={params.id} variant="detail" />
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-10">
          {SERVICE_ORDER.filter((t) => serviceTypes.includes(t)).map((type) => (
            <CategorySection
              key={type}
              type={type}
              results={resultsByType[type] ?? []}
              tripId={params.id}
            />
          ))}
        </div>
      )}
    </main>
  );
}
