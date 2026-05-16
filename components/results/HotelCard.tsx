"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { NormalizedResult } from "@/types/search";
import { useCurrency } from "@/lib/hooks/useCurrency";
import { formatDate } from "@/lib/utils/formatDate";
import { SlotBadge } from "./SlotBadge";
import { RiskBadge } from "./RiskBadge";
import { AddToTripButton } from "./AddToTripButton";

interface HotelCardProps {
  result: NormalizedResult;
  tripId: string;
}

export function HotelCard({ result, tripId }: HotelCardProps) {
  const { format } = useCurrency();
  const h = result.hotel;
  const [photoUrl, setPhotoUrl] = useState<string | null>(h?.imageUrl ?? null);

  useEffect(() => {
    if (!h || h.imageUrl) return;
    const hotelIdMatch = result.id.match(/^tp-hotel-(\d+)-/);
    const hotelId = hotelIdMatch?.[1];
    const params = new URLSearchParams();
    if (hotelId) params.set("hotelId", hotelId);
    params.set("name", h.name);
    fetch(`/api/photos/hotel?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => { const first = (d.photos as string[])[0]; if (first) setPhotoUrl(first); })
      .catch(() => null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result.id, h?.imageUrl]);

  if (!h) return null;

  const summary = `${h.name} · ${h.stars}★ · ${h.nights} night${h.nights !== 1 ? "s" : ""}`;

  return (
    <article className="bg-surface-container-low border border-outline-variant rounded-2xl overflow-hidden flex min-h-[120px]">
      {/* Image */}
      <Link
        href={`/results/hotels/${encodeURIComponent(result.id)}?tripId=${encodeURIComponent(tripId)}`}
        className="w-40 shrink-0 bg-surface-container overflow-hidden"
        tabIndex={-1}
      >
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt={h.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl text-on-surface-variant/40">hotel</span>
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="flex-1 p-4 flex flex-col gap-2 min-w-0">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="min-w-0">
            <Link href={`/results/hotels/${encodeURIComponent(result.id)}?tripId=${encodeURIComponent(tripId)}`}>
              <p className="font-semibold text-on-surface text-sm hover:text-primary transition-colors truncate">{h.name}</p>
            </Link>
            <p className="text-xs text-on-surface-variant mt-0.5">
              {"★".repeat(Math.min(5, h.stars))}
              {h.distanceFromCenterKm !== null && ` · ${h.distanceFromCenterKm.toFixed(1)} km centre`}
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5 shrink-0">
            {result.aiSlot && <SlotBadge slot={result.aiSlot} isPrimary={result.rank === 0} />}
            <RiskBadge level={result.riskLevel} reasons={result.riskReasons} />
          </div>
        </div>

        {h.rating !== null && (
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-primary px-2 py-0.5 text-xs font-bold text-white">{h.rating.toFixed(1)}</span>
            {h.reviewCount !== null && (
              <span className="text-xs text-on-surface-variant">{h.reviewCount.toLocaleString()} reviews</span>
            )}
          </div>
        )}

        <div className="text-xs text-on-surface-variant">
          {formatDate(h.checkIn)} → {formatDate(h.checkOut)} · {h.nights} night{h.nights !== 1 ? "s" : ""}
        </div>

        <div className="text-xs text-on-surface-variant">
          {h.roomType}
          {h.breakfast ? " · Breakfast included" : ""}
          <span className="ml-1 opacity-70">{h.cancellationPolicy}</span>
        </div>

        {result.aiSummary && (
          <p className="text-xs text-on-surface-variant">{result.aiSummary}</p>
        )}

        <div className="flex items-center justify-between gap-3 border-t border-outline-variant pt-2 mt-auto flex-wrap">
          <div>
            <p className="text-xl font-bold text-primary">{format(result.priceEur)}</p>
            <p className="text-xs text-on-surface-variant">total {h.nights} night{h.nights !== 1 ? "s" : ""}</p>
          </div>
          <AddToTripButton tripId={tripId} resultId={result.id} type="HOTEL" priceEur={result.priceEur} summary={summary} />
        </div>
      </div>
    </article>
  );
}
