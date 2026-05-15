"use client";

import { useState } from "react";
import type { NormalizedResult } from "@/types/search";
import type { ServiceType } from "@/types/trip";
import { CategorySection } from "./CategorySection";
import { FilterSidebar, applyFilters, DEFAULT_FILTERS, type FilterState } from "./FilterSidebar";

interface ResultsGridProps {
  results: Partial<Record<ServiceType, NormalizedResult[]>>;
  categoryErrors: Partial<Record<ServiceType, string>>;
  tripId: string;
  requestedServices: ServiceType[];
}

const SERVICE_ORDER: ServiceType[] = ["FLIGHT", "HOTEL", "CAR", "EXCURSION"];

export function ResultsGrid({ results, categoryErrors, tripId, requestedServices }: ResultsGridProps) {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  const allResults = Object.values(results).flat() as NormalizedResult[];

  const activeServices = SERVICE_ORDER.filter((s) => requestedServices.includes(s));

  return (
    <div className="flex gap-8 items-start">
      {allResults.length > 0 && (
        <div className="hidden lg:block w-64 shrink-0 sticky top-24">
          <FilterSidebar results={allResults} filters={filters} onChange={setFilters} />
        </div>
      )}

      <div className="flex-1 flex flex-col gap-10 min-w-0">
        {activeServices.map((type) => {
          const raw = results[type] ?? [];
          const filtered = applyFilters(raw, filters);
          return (
            <CategorySection
              key={type}
              type={type}
              results={filtered}
              tripId={tripId}
              error={categoryErrors[type]}
            />
          );
        })}
      </div>
    </div>
  );
}
