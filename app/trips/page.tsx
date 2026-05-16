"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { TripCard, type TripSummary } from "@/components/trips/TripCard";
import { EmptyTrips } from "@/components/trips/EmptyTrips";

interface TripsResponse {
  trips: TripSummary[];
  isAnonymous: boolean;
}

async function fetchTrips(): Promise<TripsResponse> {
  const res = await fetch("/api/trips");
  if (res.status === 401) return { trips: [], isAnonymous: true };
  if (!res.ok) throw new Error("Failed to load trips");
  return res.json() as Promise<TripsResponse>;
}

export default function TripsPage() {
  const { data, isLoading, error } = useQuery<TripsResponse>({
    queryKey: ["trips"],
    queryFn: fetchTrips,
    staleTime: 30_000,
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1
          className="text-3xl font-bold text-ink"
          style={{ fontFamily: "var(--font-editorial)" }}
        >
          My Trips
        </h1>
        <Link
          href="/explore"
          className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
        >
          + New trip
        </Link>
      </div>

      {/* Anonymous banner */}
      {data?.isAnonymous && data.trips.length > 0 && (
        <div className="mb-6 flex items-center justify-between gap-4 rounded-lg border border-hairline bg-canvas px-5 py-4">
          <p className="text-sm text-steel">
            <strong className="text-ink">Sign in</strong> to save your trips permanently across devices.
          </p>
          <Link
            href="/login"
            className="shrink-0 rounded-full border border-primary px-4 py-1.5 text-sm font-medium text-primary hover:bg-primary/5 transition-colors"
          >
            Sign in
          </Link>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center gap-3 py-12 text-steel">
          <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span>Loading trips…</span>
        </div>
      ) : error ? (
        <p className="text-red-600 bg-red-50 rounded-xl px-5 py-4 text-sm">
          {error instanceof Error ? error.message : "Could not load trips"}
        </p>
      ) : data?.trips.length === 0 ? (
        <EmptyTrips />
      ) : (
        <div className="flex flex-col gap-4">
          {data?.trips.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      )}
    </div>
  );
}
