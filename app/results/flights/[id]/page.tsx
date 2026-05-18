"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCurrency } from "@/lib/hooks/useCurrency";
import { formatTime, formatDuration, formatDate } from "@/lib/utils/formatDate";
import { AddToTripButton } from "@/components/results/AddToTripButton";
import { RiskBadge } from "@/components/results/RiskBadge";
import type { NormalizedResult } from "@/types/search";

export default function FlightDetailPage({ params }: { params: { id: string } }) {
  const searchParams = useSearchParams();
  const tripId = searchParams.get("tripId") ?? "";
  const { format } = useCurrency();

  const [result, setResult] = useState<NormalizedResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tripId) return;
    fetch(`/api/results/flight/${encodeURIComponent(params.id)}?tripId=${encodeURIComponent(tripId)}`)
      .then((r) => r.json())
      .then((d) => { setResult(d.result ?? null); })
      .catch(() => setResult(null))
      .finally(() => setLoading(false));
  }, [params.id, tripId]);

  if (loading) return <LoadingState />;
  if (!result?.flight) return <NotFound tripId={tripId} />;

  const f = result.flight;
  const airlineLogoUrl = `https://pics.avs.io/100/50/${encodeURIComponent(f.airlineCode)}.png`;

  return (
    <main className="mx-auto max-w-[840px] px-4 sm:px-6 py-6 sm:py-10">
      <div className="mb-6">
        <Link href={`/results?tripId=${encodeURIComponent(tripId)}`} className="flex items-center gap-1 text-sm text-steel hover:text-ink">
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Back to results
        </Link>
      </div>

      <div className="rounded-lg border border-hairline bg-canvas overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-4 p-6 border-b border-hairline bg-surface">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={airlineLogoUrl} alt={f.airline} className="h-10 object-contain" onError={(e) => { e.currentTarget.style.display = "none"; }} />
          <div>
            <h1 className="text-xl font-bold text-ink">{f.airline}</h1>
            <p className="text-sm text-steel">{f.airlineCode} · {f.cabin}</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <RiskBadge level={result.riskLevel} reasons={result.riskReasons} />
          </div>
        </div>

        <div className="p-6 flex flex-col gap-6">
          {/* Outbound */}
          <section>
            <p className="text-xs font-semibold text-steel uppercase tracking-wide mb-3">Outbound flight</p>
            <div className="flex items-center gap-4">
              <div className="text-center w-20">
                <p className="text-2xl font-bold text-ink">{formatTime(f.departureTime) || "—"}</p>
                <p className="text-sm text-steel">{f.departureAirport}</p>
                <p className="text-xs text-steel">{formatDate(f.departureTime)}</p>
              </div>
              <div className="flex-1 flex flex-col items-center gap-1">
                <p className="text-xs text-steel">{formatDuration(f.durationMinutes)}</p>
                <div className="w-full h-px bg-hairline" />
                <p className="text-xs text-steel">{f.stops === 0 ? "Non-stop" : f.stops === 1 ? "1 stop" : `${f.stops} stops`}</p>
              </div>
              <div className="text-center w-20">
                <p className="text-2xl font-bold text-ink">{formatTime(f.arrivalTime) || "—"}</p>
                <p className="text-sm text-steel">{f.arrivalAirport}</p>
                <p className="text-xs text-steel">{formatDate(f.arrivalTime)}</p>
              </div>
            </div>
          </section>

          {/* Return */}
          {f.returnFlight && (
            <section>
              <p className="text-xs font-semibold text-steel uppercase tracking-wide mb-3">Return flight</p>
              <div className="flex items-center gap-4">
                <div className="text-center w-20">
                  <p className="text-2xl font-bold text-ink">{formatTime(f.returnFlight.departureTime) || "—"}</p>
                  <p className="text-sm text-steel">{f.arrivalAirport}</p>
                </div>
                <div className="flex-1 flex flex-col items-center gap-1">
                  <p className="text-xs text-steel">{formatDuration(f.returnFlight.durationMinutes)}</p>
                  <div className="w-full h-px bg-hairline" />
                  <p className="text-xs text-steel">{f.returnFlight.stops === 0 ? "Non-stop" : `${f.returnFlight.stops} stop${f.returnFlight.stops > 1 ? "s" : ""}`}</p>
                </div>
                <div className="text-center w-20">
                  <p className="text-2xl font-bold text-ink">{formatTime(f.returnFlight.arrivalTime) || "—"}</p>
                  <p className="text-sm text-steel">{f.departureAirport}</p>
                </div>
              </div>
            </section>
          )}

          {/* Details */}
          <section className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-surface rounded-xl p-3">
              <p className="text-xs text-steel mb-1">Cabin</p>
              <p className="font-medium text-ink">{f.cabin}</p>
            </div>
            <div className="bg-surface rounded-xl p-3">
              <p className="text-xs text-steel mb-1">Baggage</p>
              <p className="font-medium text-ink">{f.baggage}</p>
            </div>
          </section>

          {result.riskReasons.length > 0 && (
            <section>
              <p className="text-xs font-semibold text-steel uppercase tracking-wide mb-2">Risk notes</p>
              <ul className="list-disc list-inside text-sm text-steel space-y-1">
                {result.riskReasons.map((r) => <li key={r}>{r}</li>)}
              </ul>
            </section>
          )}

          {/* Price + action */}
          <div className="flex items-center justify-between border-t border-hairline pt-4 flex-wrap gap-3">
            <div>
              <p className="text-3xl font-bold text-primary">{format(result.priceEur)}</p>
              {result.aiSummary && <p className="text-xs text-steel mt-1">{result.aiSummary}</p>}
            </div>
            <div className="flex gap-3 flex-wrap">
              <AddToTripButton tripId={tripId} resultId={result.id} type="FLIGHT" priceEur={result.priceEur} summary={`${f.airline} · ${f.departureAirport}→${f.arrivalAirport}`} />
              <a href={result.deepLinkUrl} target="_blank" rel="noopener noreferrer" className="rounded-md border border-hairline px-4 py-2 text-sm font-medium text-ink hover:bg-surface transition-colors">
                Book externally
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function LoadingState() {
  return (
    <main className="mx-auto max-w-[840px] px-4 sm:px-6 py-6 sm:py-10 flex items-center gap-3 text-steel">
      <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      <span>Loading…</span>
    </main>
  );
}

function NotFound({ tripId }: { tripId: string }) {
  return (
    <main className="mx-auto max-w-[840px] px-4 sm:px-6 py-6 sm:py-10">
      <Link href={`/results?tripId=${encodeURIComponent(tripId)}`} className="flex items-center gap-1 text-sm text-steel hover:text-ink mb-6">
        <span className="material-symbols-outlined text-base">arrow_back</span>
        Back to results
      </Link>
      <p className="text-steel">Flight not found.</p>
    </main>
  );
}
