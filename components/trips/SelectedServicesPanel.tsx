"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCurrency } from "@/lib/hooks/useCurrency";
import { formatDate, formatTime, formatDuration } from "@/lib/utils/formatDate";
import type { NormalizedResult } from "@/types/search";
import type { ServiceType } from "@/types/trip";

const TYPE_PATHS: Record<ServiceType, string> = {
  FLIGHT: "flights",
  HOTEL: "hotels",
  CAR: "cars",
  EXCURSION: "excursions",
};

const TYPE_LABELS: Record<ServiceType, string> = {
  FLIGHT: "Flight",
  HOTEL: "Hotel",
  CAR: "Car rental",
  EXCURSION: "Excursion",
};

const TYPE_ICONS: Record<ServiceType, string> = {
  FLIGHT: "flight",
  HOTEL: "hotel",
  CAR: "directions_car",
  EXCURSION: "hiking",
};

interface FullSelection {
  selection: {
    totalPriceEur: number | null;
    flightResultId: string | null;
    hotelResultId: string | null;
    carResultId: string | null;
    excursionResultId: string | null;
  } | null;
  results: Partial<Record<ServiceType, NormalizedResult>>;
}

function ServiceImage({ result, type }: { result: NormalizedResult; type: ServiceType }) {
  const imageUrl =
    type === "HOTEL" ? result.hotel?.imageUrl :
    type === "CAR" ? result.car?.imageUrl :
    type === "EXCURSION" ? result.excursion?.imageUrl :
    null;

  if (type === "FLIGHT") {
    const code = result.flight?.airlineCode ?? "";
    return (
      <div className="w-24 shrink-0 bg-surface rounded-xl flex items-center justify-center p-3 self-stretch">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://pics.avs.io/100/50/${encodeURIComponent(code)}.png`}
          alt={result.flight?.airline ?? code}
          className="max-w-full max-h-8 object-contain"
          onError={(e) => { e.currentTarget.style.display = "none"; }}
        />
      </div>
    );
  }

  return (
    <div className="w-24 shrink-0 rounded-xl overflow-hidden bg-surface self-stretch min-h-[72px]">
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <span className="material-symbols-outlined text-2xl text-steel/40">{TYPE_ICONS[type]}</span>
        </div>
      )}
    </div>
  );
}

function ServiceDetails({ result, type }: { result: NormalizedResult; type: ServiceType }) {
  if (type === "FLIGHT" && result.flight) {
    const f = result.flight;
    const stops = f.stops === 0 ? "Non-stop" : f.stops === 1 ? "1 stop" : `${f.stops} stops`;
    return (
      <div className="flex flex-col gap-0.5 min-w-0">
        <p className="font-semibold text-ink text-sm">{f.airline}</p>
        <p className="text-xs text-steel">{f.departureAirport} → {f.arrivalAirport}</p>
        <p className="text-xs text-steel">{formatTime(f.departureTime)} · {formatDuration(f.durationMinutes)} · {stops}</p>
        <p className="text-xs text-steel">{f.cabin} · {f.baggage}</p>
      </div>
    );
  }
  if (type === "HOTEL" && result.hotel) {
    const h = result.hotel;
    return (
      <div className="flex flex-col gap-0.5 min-w-0">
        <p className="font-semibold text-ink text-sm truncate">{h.name}</p>
        <p className="text-xs text-steel">{"★".repeat(Math.min(5, h.stars))}</p>
        <p className="text-xs text-steel">{formatDate(h.checkIn)} → {formatDate(h.checkOut)}</p>
        <p className="text-xs text-steel">{h.roomType} · {h.cancellationPolicy}</p>
      </div>
    );
  }
  if (type === "CAR" && result.car) {
    const c = result.car;
    return (
      <div className="flex flex-col gap-0.5 min-w-0">
        <p className="font-semibold text-ink text-sm">{c.make} {c.model}</p>
        <p className="text-xs text-steel capitalize">{c.category} · {c.seats} seats · {c.supplier}</p>
        <p className="text-xs text-steel">{formatDate(c.pickupDate)} → {formatDate(c.dropoffDate)}</p>
        <p className="text-xs text-steel">{c.days} day{c.days !== 1 ? "s" : ""} · {c.insurance} insurance</p>
      </div>
    );
  }
  if (type === "EXCURSION" && result.excursion) {
    const e = result.excursion;
    return (
      <div className="flex flex-col gap-0.5 min-w-0">
        <p className="font-semibold text-ink text-sm truncate">{e.title}</p>
        <p className="text-xs text-steel capitalize">{e.category} · {e.durationHours}h</p>
        <p className="text-xs text-steel">{formatDate(e.date)} · {e.location}</p>
      </div>
    );
  }
  return null;
}

interface Props {
  tripId: string;
  requestedServices: ServiceType[];
}

export function SelectedServicesPanel({ tripId, requestedServices }: Props) {
  const { format } = useCurrency();
  const [data, setData] = useState<FullSelection | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/trips/${encodeURIComponent(tripId)}/selection/full`)
      .then((r) => r.json())
      .then((d) => setData(d as FullSelection))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [tripId]);

  if (loading) {
    return (
      <div className="flex items-center gap-3 text-steel py-8">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="text-sm">Loading your selections…</span>
      </div>
    );
  }

  const hasAnyResult = data?.results && Object.keys(data.results).length > 0;

  if (!hasAnyResult) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <span
          className="material-symbols-outlined text-steel"
          style={{ fontSize: "48px", fontVariationSettings: "'FILL' 0, 'wght' 200" }}
        >
          add_shopping_cart
        </span>
        <div>
          <p className="font-medium text-ink">No services selected yet</p>
          <p className="text-sm text-steel mt-1">
            Go back to your search results and add services to your trip.
          </p>
        </div>
        <Link
          href={`/results?tripId=${encodeURIComponent(tripId)}`}
          className="rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
        >
          View search results
        </Link>
      </div>
    );
  }

  const selectedResults = data!.results;
  const totalPrice = data?.selection?.totalPriceEur ?? null;

  return (
    <div className="flex flex-col gap-4">
      {requestedServices.map((type) => {
        const result = selectedResults[type];
        const path = TYPE_PATHS[type];
        const label = TYPE_LABELS[type];

        if (!result) {
          // Service was requested but nothing selected
          return (
            <div key={type} className="rounded-lg border border-dashed border-hairline bg-canvas p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span
                  className="material-symbols-outlined text-steel"
                  style={{ fontSize: "24px", fontVariationSettings: "'FILL' 0, 'wght' 300" }}
                >
                  {TYPE_ICONS[type]}
                </span>
                <p className="text-sm text-steel">No {label.toLowerCase()} selected</p>
              </div>
              <Link
                href={`/results/${path}?tripId=${encodeURIComponent(tripId)}`}
                className="rounded-md border border-hairline px-4 py-1.5 text-xs font-medium text-ink hover:bg-surface transition-colors shrink-0"
              >
                Select {label.toLowerCase()}
              </Link>
            </div>
          );
        }

        return (
          <div key={type} className="rounded-lg border border-hairline bg-canvas overflow-hidden">
            <div className="flex gap-4 p-4">
              <ServiceImage result={result} type={type} />
              <div className="flex-1 min-w-0 flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-semibold text-primary uppercase tracking-wide">{label}</span>
                  <Link
                    href={`/results/${path}?tripId=${encodeURIComponent(tripId)}`}
                    className="rounded-md border border-hairline px-3 py-1 text-xs font-medium text-ink hover:bg-surface transition-colors shrink-0 flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm" aria-hidden="true">swap_horiz</span>
                    Change
                  </Link>
                </div>
                <ServiceDetails result={result} type={type} />
                <p className="text-base font-bold text-primary mt-auto">{format(result.priceEur)}</p>
              </div>
            </div>
          </div>
        );
      })}

      {totalPrice !== null && (
        <div className="flex items-center justify-between rounded-lg bg-primary/5 border border-primary/20 px-5 py-4 mt-2">
          <p className="text-sm font-medium text-ink">Estimated total</p>
          <p className="text-2xl font-bold text-primary">{format(totalPrice)}</p>
        </div>
      )}
    </div>
  );
}
