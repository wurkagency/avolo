"use client";

import { useSelectionStore } from "@/lib/state/selectionStore";
import type { ServiceType } from "@/types/trip";
import { cn } from "@/lib/utils/cn";

interface AddToTripButtonProps {
  tripId: string;
  resultId: string;
  type: ServiceType;
  priceEur: number;
  summary: string;
}

export function AddToTripButton({ tripId, resultId, type, priceEur, summary }: AddToTripButtonProps) {
  const { select, deselect, isSelected, setTripId } = useSelectionStore();
  const selected = isSelected(type, resultId);

  function toggle() {
    setTripId(tripId);
    if (selected) {
      deselect(type);
    } else {
      select(type, { resultId, priceEur, summary });
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        "rounded-md px-4 py-2 text-sm font-semibold transition-all flex items-center gap-1.5 shrink-0",
        selected
          ? "bg-primary/10 text-primary border border-primary"
          : "bg-primary text-white hover:bg-primary/90",
      )}
    >
      <span
        className="material-symbols-outlined text-base"
        style={{ fontVariationSettings: selected ? "'FILL' 1" : "'FILL' 0" }}
        aria-hidden="true"
      >
        {selected ? "check_circle" : "add_circle"}
      </span>
      {selected ? "Selected" : "Add to trip"}
    </button>
  );
}
