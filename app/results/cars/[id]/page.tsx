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
        if (r?.car?.imageUrl) {
          setGalleryPhotos([r.car.imageUrl]);
        } else if (r?.car) {
          const q = encodeURIComponent(`${r.car.make} ${r.car.model} car rental`);
          fetch(`/api/photos/unsplash?query=${q}&count=5`)
            .then((res) => res.json())
            .then((data) => { const photos = data.photos as string[]; if (photos?.length) setGalleryPhotos(photos); })
            .catch(() => null);
        }
      })
      .catch(() => setResult(null))
      .finally(() => setLoading(false));
  }, [params.id, tripId]);

  if (loading) return <LoadingState />;
  if (!result?.car) return <NotFound tripId={tripId} />;

  const c = result.car;

  return (
    <main className="mx-auto max-w-[840px] px-4 sm:px-6 py-6 sm:py-10">
      <div className="mb-6">
        <Link href={`/results?tripId=${encodeURIComponent(tripId)}`} className="flex items-center gap-1 text-sm text-steel hover:text-ink">
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Back to results
        </Link>
      </div>

      {/* Hero image */}
      {galleryPhotos[0] && (
        <div className="rounded-lg overflow-hidden h-56 mb-6 bg-surface">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={galleryPhotos[0]} alt={`${c.make} ${c.model}`} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="rounded-lg border border-hairline bg-canvas overflow-hidden">
        <div className="p-6 border-b border-hairline">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h1 className="text-xl font-bold text-ink">{c.make} {c.model}</h1>
              <p className="text-sm text-steel mt-0.5 capitalize">{c.category} · {c.seats} seats · {c.supplier}</p>
            </div>
            <RiskBadge level={result.riskLevel} reasons={result.riskReasons} />
          </div>
        </div>

        <div className="p-6 flex flex-col gap-6">
          <section className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-surface rounded-xl p-3">
              <p className="text-xs text-steel mb-1">Pick-up</p>
              <p className="font-medium text-ink">{c.pickupLocation}</p>
              <p className="text-xs text-steel">{formatDate(c.pickupDate)}</p>
            </div>
            <div className="bg-surface rounded-xl p-3">
              <p className="text-xs text-steel mb-1">Drop-off</p>
              <p className="font-medium text-ink">{c.dropoffLocation}</p>
              <p className="text-xs text-steel">{formatDate(c.dropoffDate)}</p>
            </div>
            <div className="bg-surface rounded-xl p-3">
              <p className="text-xs text-steel mb-1">Duration</p>
              <p className="font-medium text-ink">{c.days} day{c.days !== 1 ? "s" : ""}</p>
            </div>
            <div className="bg-surface rounded-xl p-3">
              <p className="text-xs text-steel mb-1">Insurance</p>
              <p className="font-medium text-ink capitalize">{c.insurance}</p>
            </div>
          </section>

          {galleryPhotos.length > 0 && (
            <section>
              <p className="text-xs font-semibold text-steel uppercase tracking-wide mb-3">Photos</p>
              <PhotoGallery photos={galleryPhotos} alt={`${c.make} ${c.model}`} />
            </section>
          )}

          {result.riskReasons.length > 0 && (
            <section>
              <p className="text-xs font-semibold text-steel uppercase tracking-wide mb-2">Risk notes</p>
              <ul className="list-disc list-inside text-sm text-steel space-y-1">
                {result.riskReasons.map((r) => <li key={r}>{r}</li>)}
              </ul>
            </section>
          )}

          <div className="flex items-center justify-between border-t border-hairline pt-4 flex-wrap gap-3">
            <div>
              <p className="text-3xl font-bold text-primary">{format(result.priceEur)}</p>
              <p className="text-xs text-steel">total for {c.days} day{c.days !== 1 ? "s" : ""}</p>
              {result.aiSummary && <p className="text-xs text-steel mt-1">{result.aiSummary}</p>}
            </div>
            <div className="flex gap-3 flex-wrap">
              <AddToTripButton tripId={tripId} resultId={result.id} type="CAR" priceEur={result.priceEur} summary={`${c.make} ${c.model} · ${c.supplier}`} />
              <a href={result.deepLinkUrl} target="_blank" rel="noopener noreferrer" className="rounded-md border border-hairline px-4 py-2 text-sm font-medium text-ink hover:bg-surface transition-colors">
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
    <main className="mx-auto max-w-[840px] px-4 sm:px-6 py-6 sm:py-10 flex items-center gap-3 text-steel">
      <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      <span>Loading…</span>
    </main>
  );
}

function NotFound({ tripId }: { tripId: string }) {
  return (
    <main className="mx-auto max-w-[840px] px-4 sm:px-6 py-6 sm:py-10">
      <Link href={`/results?tripId=${encodeURIComponent(tripId)}`} className="flex items-center gap-1 text-sm text-steel hover:text-ink mb-6">
        <span className="material-symbols-outlined text-base">arrow_back</span>
        Back to results
      </Link>
      <p className="text-steel">Car not found.</p>
    </main>
  );
}
