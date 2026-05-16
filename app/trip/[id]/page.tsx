import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/server/auth";
import { cookies } from "next/headers";
import { getTripById } from "@/server/services/tripService";
import { toSlug } from "@/server/services/journalService";
import { RefreshPricesButton } from "@/components/trips/RefreshPricesButton";
import { SelectedServicesPanel } from "@/components/trips/SelectedServicesPanel";
import { formatDate } from "@/lib/utils/formatDate";
import { formatEur } from "@/lib/utils/formatPrice";
import { formatRelativeTime } from "@/lib/utils/formatRelativeTime";
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

  const serviceTypes = trip.services.map((s) => s.type as ServiceType);
  const orderedServices = SERVICE_ORDER.filter((t) => serviceTypes.includes(t));

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
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
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
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
              <span className="text-sm text-on-surface-variant ml-2">estimated total from search</span>
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

      {/* Search results link */}
      {(trip.status === "COMPLETE" || trip.status === "STALE") && (
        <Link
          href={`/results?tripId=${encodeURIComponent(params.id)}`}
          className="flex items-center justify-between gap-4 rounded-2xl border border-outline-variant bg-surface p-4 mb-6 hover:border-primary/40 hover:shadow-sm transition-all group"
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary" aria-hidden="true"
              style={{ fontVariationSettings: "'FILL' 1, 'wght' 400" }}>search</span>
            <div>
              <p className="text-sm font-semibold text-on-surface group-hover:text-primary transition-colors">
                View all search results
              </p>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Browse and change your selected services
              </p>
            </div>
          </div>
          <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors shrink-0">chevron_right</span>
        </Link>
      )}

      {/* Travel Journal CTA */}
      <Link
        href={`/journal/${toSlug(trip.destination, trip.destinationName)}?destination=${encodeURIComponent(trip.destinationName)}&iata=${encodeURIComponent(trip.destination)}`}
        className="flex items-center justify-between gap-4 rounded-2xl border border-outline-variant bg-surface p-4 mb-8 hover:border-primary/40 hover:shadow-sm transition-all group"
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

      {/* Selected services */}
      <div className="mb-2">
        <h2 className="text-lg font-semibold text-on-surface mb-4"
          style={{ fontFamily: "var(--font-manrope)" }}>
          My selected services
        </h2>

        {trip.status === "DRAFT" || trip.status === "SEARCHING" ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm text-on-surface-variant">Search in progress — come back once results are ready.</p>
          </div>
        ) : (
          <SelectedServicesPanel tripId={params.id} requestedServices={orderedServices} />
        )}
      </div>
    </main>
  );
}
