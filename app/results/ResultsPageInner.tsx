"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useSSEStream } from "@/lib/api/streamClient";
import { useTripStore } from "@/lib/state/tripStore";
import { SSEStatus } from "@/components/results/SSEStatus";
import { ResultsGrid } from "@/components/results/ResultsGrid";
import type { ServiceType } from "@/types/trip";
import type { NormalizedResult } from "@/types/search";

export function ResultsPageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const tripId = params.get("tripId");

  const requestedServices = useTripStore((s) => s.services);
  const departure = useTripStore((s) => s.departure);
  const destination = useTripStore((s) => s.destination);

  const { status, results, isDone, error } = useSSEStream(tripId);

  // Track per-category errors (when server sends results:[] with error field)
  const [categoryErrors, setCategoryErrors] = useState<Partial<Record<ServiceType, string>>>({});

  // Redirect if no tripId
  useEffect(() => {
    if (!tripId) router.replace("/explore");
  }, [tripId, router]);

  if (!tripId) return null;

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-on-surface">
          {departure?.name && destination?.name
            ? `${departure.name} → ${destination.name}`
            : "Your trip results"}
        </h1>
        <p className="text-on-surface-variant mt-1 text-sm">
          {isDone
            ? `${Object.values(results).flat().length} results found`
            : "Searching across providers…"}
        </p>
      </div>

      {/* Streaming status banner */}
      <div className="mb-6">
        <SSEStatus status={status} isDone={isDone} error={error} />
      </div>

      {/* Results — renders each category as SSE delivers it */}
      <ResultsGrid
        results={results as Partial<Record<ServiceType, NormalizedResult[]>>}
        categoryErrors={categoryErrors}
        tripId={tripId}
        requestedServices={requestedServices}
      />
    </main>
  );
}
