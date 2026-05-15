"use client";

import type { NormalizedResult } from "@/types/search";
import { useCurrency } from "@/lib/hooks/useCurrency";
import { formatTime, formatDuration } from "@/lib/utils/formatDate";
import { SlotBadge } from "./SlotBadge";
import { RiskBadge } from "./RiskBadge";

interface FlightCardProps {
  result: NormalizedResult;
}

export function FlightCard({ result }: FlightCardProps) {
  const { format } = useCurrency();
  const f = result.flight;
  if (!f) return null;

  const stopLabel = f.stops === 0 ? "Non-stop" : f.stops === 1 ? "1 stop" : `${f.stops} stops`;

  return (
    <article className="bg-surface-container-low border border-outline-variant rounded-2xl p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-on-surface">{f.airlineCode}</span>
          <span className="text-sm text-on-surface-variant">{f.airline}</span>
        </div>
        <div className="flex flex-wrap gap-1.5 justify-end">
          {result.aiSlot && <SlotBadge slot={result.aiSlot} isPrimary={result.rank === 0} />}
          <RiskBadge level={result.riskLevel} reasons={result.riskReasons} />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-center">
          <p className="text-xl font-bold text-on-surface">{formatTime(f.departureTime) || "—"}</p>
          <p className="text-xs text-on-surface-variant">{f.departureAirport}</p>
        </div>
        <div className="flex-1 flex flex-col items-center gap-1">
          <p className="text-xs text-on-surface-variant">{formatDuration(f.durationMinutes)}</p>
          <div className="w-full h-px bg-outline-variant relative">
            <span className="absolute inset-y-0 right-0 w-1.5 h-1.5 rounded-full bg-outline-variant -translate-y-1/2" />
          </div>
          <p className="text-xs text-on-surface-variant">{stopLabel}</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-on-surface">{formatTime(f.arrivalTime) || "—"}</p>
          <p className="text-xs text-on-surface-variant">{f.arrivalAirport}</p>
        </div>
      </div>

      {f.returnFlight && (
        <div className="flex items-center gap-4 border-t border-outline-variant pt-3">
          <div className="text-center">
            <p className="text-base font-semibold text-on-surface">{formatTime(f.returnFlight.departureTime) || "—"}</p>
            <p className="text-xs text-on-surface-variant">{f.arrivalAirport}</p>
          </div>
          <div className="flex-1 flex flex-col items-center gap-1">
            <p className="text-xs text-on-surface-variant">{formatDuration(f.returnFlight.durationMinutes)}</p>
            <div className="w-full h-px bg-outline-variant" />
            <p className="text-xs text-on-surface-variant">
              {f.returnFlight.stops === 0 ? "Non-stop" : `${f.returnFlight.stops} stop${f.returnFlight.stops > 1 ? "s" : ""}`}
            </p>
          </div>
          <div className="text-center">
            <p className="text-base font-semibold text-on-surface">{formatTime(f.returnFlight.arrivalTime) || "—"}</p>
            <p className="text-xs text-on-surface-variant">{f.departureAirport}</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between border-t border-outline-variant pt-3">
        <div>
          <p className="text-2xl font-bold text-primary">{format(result.priceEur)}</p>
          <p className="text-xs text-on-surface-variant">{f.cabin} · {f.baggage}</p>
        </div>
        <a
          href={result.deepLinkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
        >
          Book now
        </a>
      </div>

      {result.aiSummary && (
        <p className="text-xs text-on-surface-variant border-t border-outline-variant pt-3">{result.aiSummary}</p>
      )}
    </article>
  );
}
