"use client";

import { useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { useUiStore } from "@/lib/state/uiStore";
import { Modal } from "@/components/ui/Modal";
import { RefreshPricesButton } from "./RefreshPricesButton";
import { useCurrency } from "@/lib/hooks/useCurrency";
import { formatDate } from "@/lib/utils/formatDate";
import { formatRelativeTime } from "@/lib/utils/formatRelativeTime";
import type { ServiceType } from "@/types/trip";

export interface TripSummary {
  id: string;
  departure: string;
  departureName: string;
  destination: string;
  destinationName: string;
  departureDate: string;
  returnDate: string | null;
  isOneWay: boolean;
  adults: number;
  status: string;
  totalPriceEur: number | null;
  lastRefreshedAt: string | null;
  createdAt: string;
  services: ServiceType[];
}

const SERVICE_ICONS: Record<ServiceType, string> = {
  FLIGHT: "flight",
  HOTEL: "hotel",
  CAR: "directions_car",
  EXCURSION: "hiking",
};

interface TripCardProps {
  trip: TripSummary;
}

export function TripCard({ trip }: TripCardProps) {
  const { format } = useCurrency();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const addToast = useUiStore((s) => s.addToast);
  const queryClient = useQueryClient();

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/trips/${encodeURIComponent(trip.id)}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete trip");
      await queryClient.invalidateQueries({ queryKey: ["trips"] });
      addToast("Trip removed", "success");
    } catch {
      addToast("Could not delete trip", "error");
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  }

  const isSearching = trip.status === "SEARCHING";
  const isComplete = trip.status === "COMPLETE";
  const isStale = trip.status === "STALE";
  const canRefresh = isComplete || isStale;

  return (
    <>
      <article className="bg-surface border border-hairline rounded-lg p-5 flex flex-col gap-4 hover:border-primary/30 transition-colors">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <Link href={`/trip/${trip.id}`} className="hover:text-primary transition-colors">
              <h2
                className="font-semibold text-ink text-base leading-tight"
                style={{ fontFamily: "var(--font-editorial)" }}
              >
                {trip.departureName} → {trip.destinationName}
              </h2>
            </Link>
            <p className="text-xs text-steel mt-1">
              {formatDate(trip.departureDate)}
              {trip.returnDate ? ` – ${formatDate(trip.returnDate)}` : " (one-way)"}
              {" · "}
              {trip.adults} adult{trip.adults !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Status badge */}
          {isSearching && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              Searching
            </span>
          )}
          {trip.status === "STALE" && (
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
              Prices may be outdated
            </span>
          )}
        </div>

        {/* Service icons */}
        <div className="flex gap-2">
          {trip.services.map((svc) => (
            <span
              key={svc}
              title={svc.charAt(0) + svc.slice(1).toLowerCase()}
              className="material-symbols-outlined text-steel"
              style={{ fontSize: "20px", fontVariationSettings: "'FILL' 0, 'wght' 300" }}
              aria-label={svc.toLowerCase()}
            >
              {SERVICE_ICONS[svc]}
            </span>
          ))}
        </div>

        {/* Price row */}
        {canRefresh && trip.totalPriceEur !== null && (
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-primary">{format(trip.totalPriceEur!)}</span>
            <span className="text-xs text-steel">estimated total</span>
          </div>
        )}

        {/* Footer row */}
        <div className="flex items-center justify-between border-t border-hairline pt-3 gap-3 flex-wrap">
          <div className="flex items-center gap-4">
            {canRefresh && (
              <RefreshPricesButton
                tripId={trip.id}
                onRefreshed={() => queryClient.invalidateQueries({ queryKey: ["trips"] })}
              />
            )}
            <span className="text-xs text-steel">
              {trip.lastRefreshedAt
                ? `Refreshed ${formatRelativeTime(trip.lastRefreshedAt)}`
                : `Added ${formatRelativeTime(trip.createdAt)}`}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/trip/${trip.id}`}
              className="rounded-md border border-hairline px-4 py-1.5 text-xs font-medium text-ink hover:bg-surface transition-colors"
            >
              View details
            </Link>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="rounded-full p-1.5 text-steel hover:text-red-600 hover:bg-red-50 transition-colors"
              aria-label="Remove this trip"
            >
              <span className="material-symbols-outlined text-base" aria-hidden="true">delete_outline</span>
            </button>
          </div>
        </div>
      </article>

      {/* Delete confirmation modal */}
      <Modal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Remove trip?"
      >
        <p className="text-steel text-sm mb-6">
          This will permanently remove your trip to{" "}
          <strong className="text-ink">{trip.destinationName}</strong> and all its saved results.
          This cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={() => setShowDeleteModal(false)}
            className="rounded-md border border-hairline px-5 py-2 text-sm font-medium text-ink hover:bg-surface transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-md bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {deleting ? "Removing…" : "Remove trip"}
          </button>
        </div>
      </Modal>
    </>
  );
}
