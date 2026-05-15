import type { AiSlot } from "@/types/search";
import { cn } from "@/lib/utils/cn";

const SLOT_LABELS: Record<string, string> = {
  BEST_VALUE: "Best value",
  CHEAPEST: "Cheapest",
  FASTEST: "Fastest",
  BEST_RATED: "Best rated",
  MOST_CENTRAL: "Most central",
  CLOSEST_PICKUP: "Closest pickup",
  BEST_COVERED: "Best covered",
  BEST_EXPERIENCE: "Best experience",
  MUST_SEE: "Must see",
  HIDDEN_GEM: "Hidden gem",
  BEST_BUDGET: "Best budget",
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
