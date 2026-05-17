"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useSSEStream } from "@/lib/api/streamClient";
import { useTripStore } from "@/lib/state/tripStore";
import { SSEStatus } from "@/components/results/SSEStatus";
import { ResultsGrid } from "@/components/results/ResultsGrid";
import { SelectionBar } from "@/components/results/SelectionBar";
import { useSelectionStore } from "@/lib/state/selectionStore";
import type { ServiceType } from "@/types/trip";
import type { NormalizedResult } from "@/types/search";

type TripSummary = {
  status: string;
  services: ServiceType[];
  departureName: string;
  destinationName: string;
};

async function loadCachedResults(
  tripId: string,
  services: ServiceType[],
): Promise<Partial<Record<ServiceType, NormalizedResult[]>>> {
  const fetches = await Promise.all(
    services.map((type) =>
      fetch(`/api/trips/${encodeURIComponent(tripId)}/results?serviceType=${type}`)
        .then((r) => (r.ok ? (r.json() as Promise<{ results: NormalizedResult[] }>) : { results: [] }))
        .then((d) => ({ type, results: d.results ?? [] })),
    ),
  );
  const byType: Partial<Record<ServiceType, NormalizedResult[]>> = {};
  for (const { type, results } of fetches) {
    byType[type] = results;
  }
  return byType;
}

export function ResultsPageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const tripId = params.get("tripId");

  const setSelectionTripId = useSelectionStore((s) => s.setTripId);
  const storeServices = useTripStore((s) => s.services);
  const storeDeparture = useTripStore((s) => s.departure);
  const storeDestination = useTripStore((s) => s.destination);

  const [trip, setTrip] = useState<TripSummary | null>(null);
  const [tripLoading, setTripLoading] = useState(true);
  const [cachedResults, setCachedResults] = useState<Partial<Record<ServiceType, NormalizedResult[]>> | null>(null);

  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch trip status on mount; poll every 2 s while SEARCHING
  useEffect(() => {
    if (!tripId) {
      setTripLoading(false);
      return;
    }

    async function check() {
      const r = await fetch(`/api/trips/${encodeURIComponent(tripId!)}`);
      if (!r.ok) { setTripLoading(false); return; }
      const t = (await r.json()) as TripSummary;
      setTrip(t);
      setTripLoading(false);
      if (t.status === "SEARCHING") {
        pollRef.current = setTimeout(check, 2000);
      }
    }

    check();
    return () => { if (pollRef.current) clearTimeout(pollRef.current); };
  }, [tripId]);

  // Load cached results when trip is already COMPLETE or STALE
  useEffect(() => {
    if (!tripId || !trip || cachedResults) return;
    if (trip.status !== "COMPLETE" && trip.status !== "STALE") return;
    loadCachedResults(tripId, trip.services).then(setCachedResults);
  }, [tripId, trip, cachedResults]);

  // Only open SSE for DRAFT trips (not yet searched); null disables the hook
  const needsStream = !tripLoading && trip?.status === "DRAFT";
  const { status, results: sseResults, isDone: sseIsDone, error: sseError } = useSSEStream(
    needsStream ? tripId : null,
  );

  useEffect(() => {
    if (!tripId) router.replace("/explore");
    else setSelectionTripId(tripId);
  }, [tripId, router, setSelectionTripId]);

  if (!tripId) return null;

  const isComplete = trip?.status === "COMPLETE" || trip?.status === "STALE";
  const isPolling = trip?.status === "SEARCHING";

  if (tripLoading || isPolling) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12">
        <div className="flex items-center gap-3 text-steel">
          <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span>{isPolling ? "Search in progress…" : "Loading…"}</span>
        </div>
      </main>
    );
  }

  const results = isComplete ? (cachedResults ?? {}) : sseResults;
  const isDone = isComplete ? cachedResults !== null : sseIsDone;
  const error = isComplete ? null : sseError;
  const requestedServices = trip?.services ?? storeServices;
  const departureName = trip?.departureName ?? storeDeparture?.name ?? "";
  const destinationName = trip?.destinationName ?? storeDestination?.name ?? "";

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-10">
        <p
          className="text-stone uppercase tracking-widest mb-2"
          style={{ fontFamily: "var(--font-inter)", fontSize: "11px", fontWeight: 600, letterSpacing: "1px" }}
        >
          {departureName && destinationName ? `${departureName} → ${destinationName}` : "Your search"}
        </p>
        <h1
          className="text-ink"
          style={{ fontFamily: "var(--font-editorial)", fontSize: "clamp(28px, 5vw, 40px)", fontWeight: 400, lineHeight: 1.1, letterSpacing: "-0.02em" }}
        >
          We found these results for you
        </h1>
        {!isDone && (
          <p className="text-steel mt-2" style={{ fontFamily: "var(--font-inter)", fontSize: "14px" }}>
            Searching across providers…
          </p>
        )}
      </div>

      {!isComplete && (
        <div className="mb-6">
          <SSEStatus status={status} isDone={isDone} error={error} />
        </div>
      )}

      <ResultsGrid
        results={results}
        categoryErrors={{}}
        tripId={tripId}
        requestedServices={requestedServices}
      />
      <SelectionBar />
    </main>
  );
}
