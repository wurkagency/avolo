"use client";

import Link from "next/link";
import type { ServiceType } from "@/types/trip";

const PATHS: Record<ServiceType, string> = {
  FLIGHT: "/results/flights",
  HOTEL: "/results/hotels",
  CAR: "/results/cars",
  EXCURSION: "/results/excursions",
};

const LABELS: Record<ServiceType, string> = {
  FLIGHT: "See all flights",
  HOTEL: "See all hotels",
  CAR: "See all car rentals",
  EXCURSION: "See all excursions",
};

interface SeeMoreButtonProps {
  serviceType: ServiceType;
  tripId: string;
  total: number;
  shown: number;
}

export function SeeMoreButton({ serviceType, tripId, total, shown }: SeeMoreButtonProps) {
  if (total <= shown) return null;

  const remaining = total - shown;

  return (
    <Link
      href={`${PATHS[serviceType]}?tripId=${encodeURIComponent(tripId)}`}
      className="flex items-center justify-center gap-2 rounded-2xl border border-outline-variant bg-surface px-6 py-3 text-sm font-medium text-on-surface hover:bg-surface-container transition-colors"
    >
      {LABELS[serviceType]}
      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
        +{remaining}
      </span>
    </Link>
  );
}
