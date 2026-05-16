"use client";

import Link from "next/link";
import type { NormalizedResult } from "@/types/search";
import { useCurrency } from "@/lib/hooks/useCurrency";
import { formatTime, formatDuration } from "@/lib/utils/formatDate";
import { SlotBadge } from "./SlotBadge";
import { RiskBadge } from "./RiskBadge";
import { AddToTripButton } from "./AddToTripButton";

interface FlightCardProps {
  result: NormalizedResult;
  tripId: string;
}

export function FlightCard({ result, tripId }: FlightCardProps) {
  const { format } = useCurrency();
  const f = result.flight;
  if (!f) return null;

  const stopLabel = f.stops === 0 ? "Non-stop" : f.stops === 1 ? "1 stop" : `${f.stops} stops`;
  const logoUrl = `https://pics.avs.io/100/50/${encodeURIComponent(f.airlineCode)}.png`;
  const summary = `${f.airline} · ${f.departureAirport}→${f.arrivalAirport} · ${stopLabel}`;

  return (
    <article className="bg-canvas border border-hairline rounded-lg overflow-hidden flex min-h-[120px]">
      {/* Airline logo */}
      <Link
        href={`/results/flights/${encodeURIComponent(result.id)}?tripId=${encodeURIComponent(tripId)}`}
        className="w-40 shrink-0 flex items-center justify-center bg-surface p-4"
        tabIndex={-1}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoUrl}
          alt={f.airline}
          className="max-w-full max-h-12 object-contain"
          onError={(e) => {
            const el = e.currentTarget;
            el.style.display = "none";
            const fallback = el.nextElementSibling as HTMLElement | null;
            if (fallback) fallback.style.display = "block";
          }}
        />
        <span className="text-sm font-bold text-steel hidden">{f.airlineCode}</span>
      </Link>

      {/* Content */}
      <div className="flex-1 p-4 flex flex-col gap-3 min-w-0">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <p className="font-semibold text-ink text-sm">{f.airline}</p>
            <p className="text-xs text-steel">{f.cabin} · {f.baggage}</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {result.aiSlot && <SlotBadge slot={result.aiSlot} isPrimary={result.rank === 0} />}
            <RiskBadge level={result.riskLevel} reasons={result.riskReasons} />
          </div>
        </div>

        {/* Outbound */}
        <div className="flex items-center gap-3">
          <div className="text-center w-14">
            <p className="text-base font-bold text-ink">{formatTime(f.departureTime) || "—"}</p>
            <p className="text-xs text-steel">{f.departureAirport}</p>
          </div>
          <div className="flex-1 flex flex-col items-center gap-0.5">
            <p className="text-xs text-steel">{formatDuration(f.durationMinutes)}</p>
            <div className="w-full h-px bg-hairline" />
            <p className="text-xs text-steel">{stopLabel}</p>
          </div>
          <div className="text-center w-14">
            <p className="text-base font-bold text-ink">{formatTime(f.arrivalTime) || "—"}</p>
            <p className="text-xs text-steel">{f.arrivalAirport}</p>
          </div>
        </div>

        {/* Return */}
        {f.returnFlight && (
          <div className="flex items-center gap-3 border-t border-hairline pt-2">
            <div className="text-center w-14">
              <p className="text-sm font-semibold text-ink">{formatTime(f.returnFlight.departureTime) || "—"}</p>
              <p className="text-xs text-steel">{f.arrivalAirport}</p>
            </div>
            <div className="flex-1 flex flex-col items-center gap-0.5">
              <p className="text-xs text-steel">{formatDuration(f.returnFlight.durationMinutes)}</p>
              <div className="w-full h-px bg-hairline" />
              <p className="text-xs text-steel">
                {f.returnFlight.stops === 0 ? "Non-stop" : `${f.returnFlight.stops} stop${f.returnFlight.stops > 1 ? "s" : ""}`}
              </p>
            </div>
            <div className="text-center w-14">
              <p className="text-sm font-semibold text-ink">{formatTime(f.returnFlight.arrivalTime) || "—"}</p>
              <p className="text-xs text-steel">{f.departureAirport}</p>
            </div>
          </div>
        )}

        {result.aiSummary && (
          <p className="text-xs text-steel">{result.aiSummary}</p>
        )}

        {/* Price + action */}
        <div className="flex items-center justify-between gap-3 border-t border-hairline pt-2 mt-auto flex-wrap">
          <div>
            <p className="text-xl font-bold text-primary">{format(result.priceEur)}</p>
          </div>
          <AddToTripButton tripId={tripId} resultId={result.id} type="FLIGHT" priceEur={result.priceEur} summary={summary} />
        </div>
      </div>
    </article>
  );
}
