"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { NormalizedResult } from "@/types/search";
import { useCurrency } from "@/lib/hooks/useCurrency";
import { formatDate } from "@/lib/utils/formatDate";
import { SlotBadge } from "./SlotBadge";
import { RiskBadge } from "./RiskBadge";
import { AddToTripButton } from "./AddToTripButton";

interface ExcursionCardProps {
  result: NormalizedResult;
  tripId: string;
}

export function ExcursionCard({ result, tripId }: ExcursionCardProps) {
  const { format } = useCurrency();
  const e = result.excursion;
  const [photoUrl, setPhotoUrl] = useState<string | null>(e?.imageUrl ?? null);

  useEffect(() => {
    if (!e || e.imageUrl) return;
    const title = encodeURIComponent(e.title);
    const location = encodeURIComponent(e.location);
    fetch(`/api/photos/excursion?title=${title}&location=${location}`)
      .then((r) => r.json())
      .then((d) => { const first = (d.photos as string[])[0]; if (first) setPhotoUrl(first); })
      .catch(() => null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [e?.title, e?.location, e?.imageUrl]);

  if (!e) return null;

  const summary = `${e.title} · ${e.durationHours}h · ${e.category}`;

  return (
    <article className="bg-canvas border border-hairline rounded-lg overflow-hidden flex min-h-[120px]">
      {/* Image */}
      <Link
        href={`/results/excursions/${encodeURIComponent(result.id)}?tripId=${encodeURIComponent(tripId)}`}
        className="w-40 shrink-0 bg-surface overflow-hidden"
        tabIndex={-1}
      >
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt={e.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl text-steel/40">hiking</span>
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="flex-1 p-4 flex flex-col gap-2 min-w-0">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="min-w-0">
            <Link href={`/results/excursions/${encodeURIComponent(result.id)}?tripId=${encodeURIComponent(tripId)}`}>
              <p className="font-semibold text-ink text-sm hover:text-primary transition-colors truncate">{e.title}</p>
            </Link>
            <p className="text-xs text-steel mt-0.5 capitalize">{e.category} · {e.durationHours}h · {e.location}</p>
          </div>
          <div className="flex flex-wrap gap-1.5 shrink-0">
            {result.aiSlot && <SlotBadge slot={result.aiSlot} isPrimary={result.rank === 0} />}
            <RiskBadge level={result.riskLevel} reasons={result.riskReasons} />
          </div>
        </div>

        <p className="text-xs text-steel line-clamp-2">{e.description}</p>

        {e.includes.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {e.includes.slice(0, 3).map((item) => (
              <span key={item} className="rounded-full bg-surface px-2 py-0.5 text-xs text-steel">
                {item}
              </span>
            ))}
          </div>
        )}

        <div className="text-xs text-steel">
          {formatDate(e.date)}{e.groupSize && ` · ${e.groupSize}`}
        </div>

        {result.aiSummary && (
          <p className="text-xs text-steel">{result.aiSummary}</p>
        )}

        <div className="flex items-center justify-between gap-3 border-t border-hairline pt-2 mt-auto flex-wrap">
          <p className="text-xl font-bold text-primary">{format(result.priceEur)}</p>
          <AddToTripButton tripId={tripId} resultId={result.id} type="EXCURSION" priceEur={result.priceEur} summary={summary} />
        </div>
      </div>
    </article>
  );
}
