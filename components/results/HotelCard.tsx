"use client";

import type { NormalizedResult } from "@/types/search";
import { useCurrency } from "@/lib/hooks/useCurrency";
import { formatDate } from "@/lib/utils/formatDate";
import { SlotBadge } from "./SlotBadge";
import { RiskBadge } from "./RiskBadge";

interface HotelCardProps {
  result: NormalizedResult;
}

export function HotelCard({ result }: HotelCardProps) {
  const { format } = useCurrency();
  const h = result.hotel;
  if (!h) return null;

  return (
    <article className="bg-surface-container-low border border-outline-variant rounded-2xl overflow-hidden flex flex-col">
      {h.imageUrl && (
        <div className="h-40 bg-surface-container overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={h.imageUrl} alt={h.name} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="p-5 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold text-on-surface">{h.name}</p>
            <p className="text-xs text-on-surface-variant mt-0.5">
              {"★".repeat(Math.min(5, h.stars))}
              {h.distanceFromCenterKm !== null && ` · ${h.distanceFromCenterKm.toFixed(1)} km from centre`}
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5 justify-end">
            {result.aiSlot && <SlotBadge slot={result.aiSlot} isPrimary={result.rank === 0} />}
            <RiskBadge level={result.riskLevel} reasons={result.riskReasons} />
          </div>
        </div>

        {h.rating !== null && (
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-primary px-2 py-0.5 text-sm font-bold text-white">
              {h.rating.toFixed(1)}
            </span>
            <span className="text-xs text-on-surface-variant">
              {h.reviewCount !== null ? `${h.reviewCount.toLocaleString()} reviews` : "Guest score"}
            </span>
          </div>
        )}

        <div className="text-sm text-on-surface-variant">
          <span>{formatDate(h.checkIn)} → {formatDate(h.checkOut)}</span>
          <span className="mx-2">·</span>
          <span>{h.nights} night{h.nights !== 1 ? "s" : ""}</span>
        </div>

        <div className="text-xs text-on-surface-variant">
          {h.roomType}
          {h.breakfast ? " · Breakfast included" : ""}
          <span className="ml-2 text-on-surface-variant/70">{h.cancellationPolicy}</span>
        </div>

        <div className="flex items-center justify-between border-t border-outline-variant pt-3">
          <div>
            <p className="text-2xl font-bold text-primary">{format(result.priceEur)}</p>
            <p className="text-xs text-on-surface-variant">total for {h.nights} night{h.nights !== 1 ? "s" : ""}</p>
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
      </div>
    </article>
  );
}
