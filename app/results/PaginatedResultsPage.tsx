"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { fetchTripResults } from "@/lib/api/tripsClient";
import { FlightCard } from "@/components/results/FlightCard";
import { HotelCard } from "@/components/results/HotelCard";
import { CarCard } from "@/components/results/CarCard";
import { ExcursionCard } from "@/components/results/ExcursionCard";
import { FilterSidebar, applyFilters, DEFAULT_FILTERS, type FilterState } from "@/components/results/FilterSidebar";
import type { NormalizedResult } from "@/types/search";
import type { ServiceType } from "@/types/trip";

interface PaginatedResultsPageProps {
  serviceType: ServiceType;
  title: string;
}

function renderCard(result: NormalizedResult) {
  switch (result.serviceType) {
    case "FLIGHT": return <FlightCard key={result.id} result={result} />;
    case "HOTEL": return <HotelCard key={result.id} result={result} />;
    case "CAR": return <CarCard key={result.id} result={result} />;
    case "EXCURSION": return <ExcursionCard key={result.id} result={result} />;
  }
}

export function PaginatedResultsPage({ serviceType, title }: PaginatedResultsPageProps) {
  const router = useRouter();
  const params = useSearchParams();
  const tripId = params.get("tripId");
  const initialPage = Math.max(1, parseInt(params.get("page") ?? "1", 10));

  const [page, setPage] = useState(initialPage);
  const [results, setResults] = useState<NormalizedResult[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  useEffect(() => {
    if (!tripId) { router.replace("/explore"); }
  }, [tripId, router]);

  const load = useCallback(async (p: number) => {
    if (!tripId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTripResults(tripId, { serviceType, page: p });
      setResults(data.results);
      setTotalPages(data.pages);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load results");
    } finally {
      setLoading(false);
    }
  }, [tripId, serviceType]);

  useEffect(() => { void load(page); }, [load, page]);

  if (!tripId) return null;

  const filtered = applyFilters(results, filters);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8 flex items-center gap-3">
        <Link
          href={`/results?tripId=${encodeURIComponent(tripId)}`}
          className="rounded-full p-2 hover:bg-surface-container transition-colors"
          aria-label="Back to results"
        >
          <span className="material-symbols-outlined text-on-surface-variant">arrow_back</span>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-on-surface">{title}</h1>
          <p className="text-sm text-on-surface-variant">{total} results</p>
        </div>
      </div>

      <div className="flex gap-8 items-start">
        <div className="hidden lg:block w-64 shrink-0 sticky top-24">
          <FilterSidebar results={results} filters={filters} onChange={setFilters} />
        </div>

        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="flex items-center gap-3 text-on-surface-variant py-12 justify-center">
              <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span>Loading…</span>
            </div>
          ) : error ? (
            <p className="text-red-600 bg-red-50 rounded-xl px-5 py-4">{error}</p>
          ) : filtered.length === 0 ? (
            <p className="text-on-surface-variant text-center py-12">No results match your filters.</p>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                {filtered.map(renderCard)}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="rounded-full px-4 py-2 text-sm font-medium border border-outline-variant disabled:opacity-40 hover:bg-surface-container transition-colors"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-on-surface-variant">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="rounded-full px-4 py-2 text-sm font-medium border border-outline-variant disabled:opacity-40 hover:bg-surface-container transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
