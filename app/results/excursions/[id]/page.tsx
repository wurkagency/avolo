"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCurrency } from "@/lib/hooks/useCurrency";
import { formatDate } from "@/lib/utils/formatDate";
import { AddToTripButton } from "@/components/results/AddToTripButton";
import { RiskBadge } from "@/components/results/RiskBadge";
import { PhotoGallery } from "@/components/results/PhotoGallery";
import type { NormalizedResult } from "@/types/search";

export default function ExcursionDetailPage({ params }: { params: { id: string } }) {
  const searchParams = useSearchParams();
  const tripId = searchParams.get("tripId") ?? "";
  const { format } = useCurrency();

  const [result, setResult] = useState<NormalizedResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [galleryPhotos, setGalleryPhotos] = useState<string[]>([]);

  useEffect(() => {
    if (!tripId) return;
    fetch(`/api/results/excursion/${encodeURIComponent(params.id)}?tripId=${encodeURIComponent(tripId)}`)
      .then((r) => r.json())
      .then((d) => {
        const r = d.result as NormalizedResult | null;
        setResult(r ?? null);
        if (r?.excursion) {
          const initial = r.excursion.imageUrl ? [r.excursion.imageUrl] : [];
          setGalleryPhotos(initial);
          // Google Places only — fetches photos of the specific location
          const title = encodeURIComponent(r.excursion.title);
          const location = encodeURIComponent(r.excursion.location);
          fetch(`/api/photos/excursion?title=${title}&location=${location}`)
            .then((res) => res.json())
            .then((data) => {
              const placesPhotos = data.photos as string[];
              if (placesPhotos.length > 0) {
                const combined = Array.from(new Set(placesPhotos)).slice(0, 6);
                setGalleryPhotos(combined);
              }
              // If Places returns nothing, keep the single imageUrl (no Unsplash fallback)
            })
            .catch(() => null);
        }
      })
      .catch(() => setResult(null))
      .finally(() => setLoading(false));
  }, [params.id, tripId]);

  if (loading) return <LoadingState />;
  if (!result?.excursion) return <NotFound tripId={tripId} />;

  const e = result.excursion;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6">
        <Link href={`/results?tripId=${encodeURIComponent(tripId)}`} className="flex items-center gap-1 text-sm text-on-surface-variant hover:text-on-surface">
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Back to results
        </Link>
      </div>

      {/* Hero image */}
      {e.imageUrl && (
        <div className="rounded-2xl overflow-hidden h-56 mb-6 bg-surface-container">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={e.imageUrl} alt={e.title} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="rounded-2xl border border-outline-variant bg-surface-container-low overflow-hidden">
        <div className="p-6 border-b border-outline-variant">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h1 className="text-xl font-bold text-on-surface">{e.title}</h1>
              <p className="text-sm text-on-surface-variant mt-0.5 capitalize">{e.category} · {e.durationHours}h · {e.location}</p>
            </div>
            <RiskBadge level={result.riskLevel} reasons={result.riskReasons} />
          </div>
        </div>

        <div className="p-6 flex flex-col gap-6">
          <p className="text-sm text-on-surface-variant leading-relaxed">{e.description}</p>

          <section className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-surface-container rounded-xl p-3">
              <p className="text-xs text-on-surface-variant mb-1">Date</p>
              <p className="font-medium text-on-surface">{formatDate(e.date)}</p>
            </div>
            <div className="bg-surface-container rounded-xl p-3">
              <p className="text-xs text-on-surface-variant mb-1">Duration</p>
              <p className="font-medium text-on-surface">{e.durationHours} hours</p>
            </div>
            {e.groupSize && (
              <div className="bg-surface-container rounded-xl p-3 col-span-2">
                <p className="text-xs text-on-surface-variant mb-1">Group size</p>
                <p className="font-medium text-on-surface">{e.groupSize}</p>
              </div>
            )}
          </section>

          {e.includes.length > 0 && (
            <section>
              <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-2">What&apos;s included</p>
              <div className="flex flex-wrap gap-2">
                {e.includes.map((item) => (
                  <span key={item} className="rounded-full bg-surface-container px-3 py-1 text-xs text-on-surface-variant">
                    {item}
                  </span>
                ))}
              </div>
            </section>
          )}

          {galleryPhotos.length > 1 && (
            <section>
              <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-3">Photos</p>
              <PhotoGallery photos={galleryPhotos} alt={e.title} />
            </section>
          )}

          <div className="flex items-center justify-between border-t border-outline-variant pt-4 flex-wrap gap-3">
            <div>
              <p className="text-3xl font-bold text-primary">{format(result.priceEur)}</p>
              {result.aiSummary && <p className="text-xs text-on-surface-variant mt-1">{result.aiSummary}</p>}
            </div>
            <div className="flex gap-3 flex-wrap">
              <AddToTripButton tripId={tripId} resultId={result.id} type="EXCURSION" priceEur={result.priceEur} summary={`${e.title} · ${e.durationHours}h`} />
              <a href={result.deepLinkUrl} target="_blank" rel="noopener noreferrer" className="rounded-full border border-outline-variant px-4 py-2 text-sm font-medium text-on-surface hover:bg-surface-container transition-colors">
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
    <main className="mx-auto max-w-3xl px-4 py-10 flex items-center gap-3 text-on-surface-variant">
      <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      <span>Loading…</span>
    </main>
  );
}

function NotFound({ tripId }: { tripId: string }) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Link href={`/results?tripId=${encodeURIComponent(tripId)}`} className="flex items-center gap-1 text-sm text-on-surface-variant hover:text-on-surface mb-6">
        <span className="material-symbols-outlined text-base">arrow_back</span>
        Back to results
      </Link>
      <p className="text-on-surface-variant">Excursion not found.</p>
    </main>
  );
}
