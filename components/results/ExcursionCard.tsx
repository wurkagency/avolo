"use client";

import type { NormalizedResult } from "@/types/search";
import { useCurrency } from "@/lib/hooks/useCurrency";
import { formatDate } from "@/lib/utils/formatDate";
import { SlotBadge } from "./SlotBadge";
import { RiskBadge } from "./RiskBadge";

interface ExcursionCardProps {
  result: NormalizedResult;
}

export function ExcursionCard({ result }: ExcursionCardProps) {
  const { format } = useCurrency();
  const e = result.excursion;
  if (!e) return null;

  return (
    <article className="bg-surface-container-low border border-outline-variant rounded-2xl overflow-hidden flex flex-col">
      {e.imageUrl && (
        <div className="h-40 bg-surface-container overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={e.imageUrl} alt={e.title} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="p-5 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold text-on-surface">{e.title}</p>
            <p className="text-xs text-on-surface-variant mt-0.5 capitalize">
              {e.category} · {e.durationHours}h · {e.location}
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5 justify-end">
            {result.aiSlot && <SlotBadge slot={result.aiSlot} isPrimary={result.rank === 0} />}
            <RiskBadge level={result.riskLevel} reasons={result.riskReasons} />
          </div>
        </div>

        <p className="text-sm text-on-surface-variant line-clamp-2">{e.description}</p>

        {e.includes.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {e.includes.map((item) => (
              <span key={item} className="rounded-full bg-surface-container px-2.5 py-0.5 text-xs text-on-surface-variant">
                {item}
              </span>
            ))}
          </div>
        )}

        <div className="text-xs text-on-surface-variant">
          {formatDate(e.date)}
          {e.groupSize && <span> · {e.groupSize}</span>}
        </div>

        <div className="flex items-center justify-between border-t border-outline-variant pt-3">
          <p className="text-2xl font-bold text-primary">{format(result.priceEur)}</p>
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
