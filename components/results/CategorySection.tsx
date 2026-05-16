import type { NormalizedResult } from "@/types/search";
import type { ServiceType } from "@/types/trip";
import { FlightCard } from "./FlightCard";
import { HotelCard } from "./HotelCard";
import { CarCard } from "./CarCard";
import { ExcursionCard } from "./ExcursionCard";
import { SeeMoreButton } from "./SeeMoreButton";

const TITLES: Record<ServiceType, string> = {
  FLIGHT: "Flights",
  HOTEL: "Hotels",
  CAR: "Car rentals",
  EXCURSION: "Excursions",
};

const INLINE_LIMIT = 4;

interface CategorySectionProps {
  type: ServiceType;
  results: NormalizedResult[];
  tripId: string;
  error?: string;
}

function renderCard(result: NormalizedResult, tripId: string) {
  switch (result.serviceType) {
    case "FLIGHT": return <FlightCard key={result.id} result={result} tripId={tripId} />;
    case "HOTEL": return <HotelCard key={result.id} result={result} tripId={tripId} />;
    case "CAR": return <CarCard key={result.id} result={result} tripId={tripId} />;
    case "EXCURSION": return <ExcursionCard key={result.id} result={result} tripId={tripId} />;
  }
}

export function CategorySection({ type, results, tripId, error }: CategorySectionProps) {
  const sorted = [...results].sort((a, b) => a.rank - b.rank);
  const visible = sorted.slice(0, INLINE_LIMIT);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-on-surface">{TITLES[type]}</h2>
        {results.length > 0 && (
          <span className="text-sm text-on-surface-variant">{results.length} found</span>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</p>
      )}

      {visible.length === 0 && !error ? (
        <p className="text-sm text-on-surface-variant bg-surface-container-low rounded-2xl px-5 py-6 text-center">
          No {TITLES[type].toLowerCase()} found for your search.
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {visible.map((r) => renderCard(r, tripId))}
          </div>
          <SeeMoreButton serviceType={type} tripId={tripId} total={results.length} shown={visible.length} />
        </>
      )}
    </section>
  );
}
