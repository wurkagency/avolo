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

export default function CarDetailPage({ params }: { params: { id: string } }) {
  const searchParams = useSearchParams();
  const tripId = searchParams.get("tripId") ?? "";
  const { format } = useCurrency();

  const [result, setResult] = useState<NormalizedResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [galleryPhotos, setGalleryPhotos] = useState<string[]>([]);

  useEffect(() => {
    if (!tripId) return;
    fetch(`/api/results/car/${encodeURIComponent(params.id)}?tripId=${encodeURIComponent(tripId)}`)
      .then((r) => r.json())
      .then((d) => {
        const r = d.result as NormalizedResult | null;
        setResult(r ?? null);
        // Only use the image URL provided by the booking source (TravelPayouts, etc.)
        if (r?.car?.imageUrl) setGalleryPhotos([r.car.imageUrl]);
      })
      .catch(() => setResult(null))
      .finally(() => setLoading(false));
  }, [params.id, tripId]);

  if (loading) return <LoadingState />;
  if (!result?.car) return <NotFound tripId={tripId} />;

  const c = result.car;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6">
        <Link href={`/results?tripId=${encodeURIComponent(tripId)}`} className="flex items-center gap-1 text-sm text-on-surface-variant hover:text-on-surface">
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Back to results
        </Link>
      </div>

      {/* Hero image */}
      {c.imageUrl && (
        <div className="rounded-2xl overflow-hidden h-56 mb-6 bg-surface-container">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={c.imageUrl} alt={`${c.make} ${c.model}`} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="rounded-2xl border border-outline-variant bg-surface-container-low overflow-hidden">
        <div className="p-6 border-b border-outline-variant">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h1 className="text-xl font-bold text-on-surface">{c.make} {c.model}</h1>
              <p className="text-sm text-on-surface-variant mt-0.5 capitalize">{c.category} · {c.seats} seats · {c.supplier}</p>
            </div>
            <RiskBadge level={result.riskLevel} reasons={result.riskReasons} />
          </div>
        </div>

        <div className="p-6 flex flex-col gap-6">
          <section className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-surface-container rounded-xl p-3">
              <p className="text-xs text-on-surface-variant mb-1">Pick-up</p>
              <p className="font-medium text-on-surface">{c.pickupLocation}</p>
              <p className="text-xs text-on-surface-variant">{formatDate(c.pickupDate)}</p>
            </div>
            <div className="bg-surface-container rounded-xl p-3">
              <p className="text-xs text-on-surface-variant mb-1">Drop-off</p>
              <p className="font-medium text-on-surface">{c.dropoffLocation}</p>
              <p className="text-xs text-on-surface-variant">{formatDate(c.dropoffDate)}</p>
            </div>
            <div className="bg-surface-container rounded-xl p-3">
              <p className="text-xs text-on-surface-variant mb-1">Duration</p>
              <p className="font-medium text-on-surface">{c.days} day{c.days !== 1 ? "s" : ""}</p>
            </div>
            <div className="bg-surface-container rounded-xl p-3">
              <p className="text-xs text-on-surface-variant mb-1">Insurance</p>
              <p className="font-medium text-on-surface capitalize">{c.insurance}</p>
            </div>
          </section>

          {galleryPhotos.length > 0 && (
            <section>
              <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-3">Photos</p>
              <PhotoGallery photos={galleryPhotos} alt={`${c.make} ${c.model}`} />
            </section>
          )}

          {result.riskReasons.length > 0 && (
            <section>
              <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-2">Risk notes</p>
              <ul className="list-disc list-inside text-sm text-on-surface-variant space-y-1">
                {result.riskReasons.map((r) => <li key={r}>{r}</li>)}
              </ul>
            </section>
          )}

          <div className="flex items-center justify-between border-t border-outline-variant pt-4 flex-wrap gap-3">
            <div>
              <p className="text-3xl font-bold text-primary">{format(result.priceEur)}</p>
              <p className="text-xs text-on-surface-variant">total for {c.days} day{c.days !== 1 ? "s" : ""}</p>
              {result.aiSummary && <p className="text-xs text-on-surface-variant mt-1">{result.aiSummary}</p>}
            </div>
            <div className="flex gap-3 flex-wrap">
              <AddToTripButton tripId={tripId} resultId={result.id} type="CAR" priceEur={result.priceEur} summary={`${c.make} ${c.model} · ${c.supplier}`} />
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
      <p className="text-on-surface-variant">Car not found.</p>
    </main>
  );
}
