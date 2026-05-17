import type { AiSlot } from "@/types/search";
import { cn } from "@/lib/utils/cn";

const SLOT_LABELS: Record<string, string> = {
  BEST_VALUE:      "Best Choice",
  CHEAPEST:        "Cheapest Option",
  FASTEST:         "Shortest Travel Time",
  BEST_RATED:      "Best Rating",
  MOST_CENTRAL:    "Most Central",
  CLOSEST_PICKUP:  "Closest Pickup",
  BEST_COVERED:    "Best Covered",
  BEST_EXPERIENCE: "Best Experience",
  MUST_SEE:        "Must-See",
  HIDDEN_GEM:      "Hidden Gem",
  BEST_BUDGET:     "Best Budget",
};

interface SlotBadgeProps {
  slot: AiSlot;
  isPrimary?: boolean;
  className?: string;
}

export function SlotBadge({ slot, isPrimary, className }: SlotBadgeProps) {
  return (
    <span
      className={cn(
        "inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold",
        isPrimary
          ? "bg-primary text-white"
          : "bg-primary/10 text-primary",
        className,
      )}
    >
      {SLOT_LABELS[slot] ?? slot}
    </span>
  );
}
