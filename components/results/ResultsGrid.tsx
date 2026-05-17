"use client";

import type { NormalizedResult } from "@/types/search";
import type { ServiceType } from "@/types/trip";
import { CategorySection } from "./CategorySection";

interface ResultsGridProps {
  results: Partial<Record<ServiceType, NormalizedResult[]>>;
  categoryErrors: Partial<Record<ServiceType, string>>;
  tripId: string;
  requestedServices: ServiceType[];
}

const SERVICE_ORDER: ServiceType[] = ["FLIGHT", "HOTEL", "CAR", "EXCURSION"];

export function ResultsGrid({ results, categoryErrors, tripId, requestedServices }: ResultsGridProps) {
  const activeServices = SERVICE_ORDER.filter((s) => requestedServices.includes(s));

  return (
    <div className="flex flex-col gap-12">
      {activeServices.map((type) => (
        <CategorySection
          key={type}
          type={type}
          results={results[type] ?? []}
          tripId={tripId}
          error={categoryErrors[type]}
        />
      ))}
    </div>
  );
}
