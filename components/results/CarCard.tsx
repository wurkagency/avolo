"use client";

import type { NormalizedResult } from "@/types/search";
import { useCurrency } from "@/lib/hooks/useCurrency";
import { formatDate } from "@/lib/utils/formatDate";
import { SlotBadge } from "./SlotBadge";
import { RiskBadge } from "./RiskBadge";

interface CarCardProps {
  result: NormalizedResult;
}

export function CarCard({ result }: CarCardProps) {
  const { format } = useCurrency();
  const c = result.car;
  if (!c) return null;

  return (
    <article className="bg-surface-container-low border border-outline-variant rounded-2xl p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-on-surface">{c.make} {c.model}</p>
          <p className="text-xs text-on-surface-variant mt-0.5 capitalize">
            {c.category} · {c.seats} seats · {c.supplier}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5 justify-end">
          {result.aiSlot && <SlotBadge slot={result.aiSlot} isPrimary={result.rank === 0} />}
          <RiskBadge level={result.riskLevel} reasons={result.riskReasons} />
        </div>
      </div>

      <div className="flex flex-col gap-1 text-sm text-on-surface-variant">
        <div className="flex items-start gap-2">
          <span className="material-symbols-outlined text-base">location_on</span>
          <div>
            <p className="text-on-surface font-medium">{c.pickupLocation}</p>
            <p className="text-xs">{formatDate(c.pickupDate)} → {formatDate(c.dropoffDate)}</p>
          </div>
        </div>
        <p className="text-xs ml-6">{c.days} day{c.days !== 1 ? "s" : ""} · {c.insurance}</p>
      </div>

      <div className="flex items-center justify-between border-t border-outline-variant pt-3">
        <div>
          <p className="text-2xl font-bold text-primary">{format(result.priceEur)}</p>
          <p className="text-xs text-on-surface-variant">total for {c.days} day{c.days !== 1 ? "s" : ""}</p>
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
