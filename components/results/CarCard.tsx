"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { NormalizedResult } from "@/types/search";
import { useCurrency } from "@/lib/hooks/useCurrency";
import { formatDate } from "@/lib/utils/formatDate";
import { SlotBadge } from "./SlotBadge";
import { RiskBadge } from "./RiskBadge";
import { AddToTripButton } from "./AddToTripButton";

interface CarCardProps {
  result: NormalizedResult;
  tripId: string;
}

export function CarCard({ result, tripId }: CarCardProps) {
  const { format } = useCurrency();
  const c = result.car;
  const [fallbackImg, setFallbackImg] = useState<string | null>(null);

  useEffect(() => {
    if (!c || c.imageUrl) return;
    const q = encodeURIComponent(`${c.make} ${c.model} car`);
    fetch(`/api/photos/unsplash?query=${q}&count=1`)
      .then((r) => r.json())
      .then((d) => { const url = (d.photos as string[])[0]; if (url) setFallbackImg(url); })
      .catch(() => null);
  }, [c?.make, c?.model, c?.imageUrl]);

  if (!c) return null;

  const summary = `${c.make} ${c.model} · ${c.category} · ${c.supplier}`;
  const displayImg = c.imageUrl ?? fallbackImg;

  return (
    <article className="bg-canvas border border-hairline rounded-lg overflow-hidden flex min-h-[120px]">
      {/* Image */}
      <Link
        href={`/results/cars/${encodeURIComponent(result.id)}?tripId=${encodeURIComponent(tripId)}`}
        className="w-40 shrink-0 bg-surface overflow-hidden"
        tabIndex={-1}
      >
        {displayImg ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={displayImg} alt={`${c.make} ${c.model}`} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl text-steel/40">directions_car</span>
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="flex-1 p-4 flex flex-col gap-2 min-w-0">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="min-w-0">
            <Link href={`/results/cars/${encodeURIComponent(result.id)}?tripId=${encodeURIComponent(tripId)}`}>
              <p className="font-semibold text-ink text-sm hover:text-primary transition-colors">{c.make} {c.model}</p>
            </Link>
            <p className="text-xs text-steel mt-0.5 capitalize">{c.category} · {c.seats} seats · {c.supplier}</p>
          </div>
          <div className="flex flex-wrap gap-1.5 shrink-0">
            {result.aiSlot && <SlotBadge slot={result.aiSlot} isPrimary={result.rank === 0} />}
            {result.provider === "stub" && (
              <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700" title="Estimated prices — click to see live rates">
                Estimated
              </span>
            )}
            <RiskBadge level={result.riskLevel} reasons={result.riskReasons} />
          </div>
        </div>

        <div className="flex items-start gap-2 text-xs text-steel">
          <span className="material-symbols-outlined text-sm">location_on</span>
          <div>
            <p className="text-ink font-medium">{c.pickupLocation}</p>
            <p>{formatDate(c.pickupDate)} → {formatDate(c.dropoffDate)}</p>
          </div>
        </div>

        <p className="text-xs text-steel">{c.days} day{c.days !== 1 ? "s" : ""} · {c.insurance} insurance</p>

        {result.aiSummary && (
          <p className="text-xs text-steel">{result.aiSummary}</p>
        )}

        <div className="flex items-center justify-between gap-3 border-t border-hairline pt-2 mt-auto flex-wrap">
          <div>
            <p className="text-xl font-bold text-primary">{format(result.priceEur)}</p>
            <p className="text-xs text-steel">total {c.days} day{c.days !== 1 ? "s" : ""}</p>
          </div>
          <AddToTripButton tripId={tripId} resultId={result.id} type="CAR" priceEur={result.priceEur} summary={summary} />
        </div>
      </div>
    </article>
  );
}
