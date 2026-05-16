"use client";

import { useSelectionStore } from "@/lib/state/selectionStore";
import { useCurrency } from "@/lib/hooks/useCurrency";

const TYPE_ICONS: Record<string, string> = {
  FLIGHT: "flight",
  HOTEL: "hotel",
  CAR: "directions_car",
  EXCURSION: "hiking",
};

export function SelectionBar() {
  const { items, totalPrice } = useSelectionStore();
  const { format } = useCurrency();

  const selected = Object.entries(items).filter(([, v]) => v !== undefined);
  if (selected.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-outline-variant bg-surface/95 backdrop-blur-sm shadow-lg">
      <div className="mx-auto max-w-5xl px-4 py-3 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-1 min-w-0 flex-wrap">
          {selected.map(([type, item]) => item && (
            <span key={type} className="flex items-center gap-1.5 text-sm text-on-surface">
              <span
                className="material-symbols-outlined text-primary"
                style={{ fontSize: "18px", fontVariationSettings: "'FILL' 1" }}
                aria-hidden="true"
              >
                {TYPE_ICONS[type]}
              </span>
              <span className="text-on-surface-variant truncate max-w-[120px]">{item.summary}</span>
            </span>
          ))}
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right">
            <p className="text-xs text-on-surface-variant">Total</p>
            <p className="text-lg font-bold text-primary">{format(totalPrice())}</p>
          </div>
          <span className="text-sm font-medium text-on-surface-variant">
            {selected.length} item{selected.length !== 1 ? "s" : ""} selected
          </span>
        </div>
      </div>
    </div>
  );
}
