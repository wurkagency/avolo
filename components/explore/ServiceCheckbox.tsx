"use client";

import { cn } from "@/lib/utils/cn";
import type { ServiceType } from "@/types/trip";

interface ServiceOption {
  value: ServiceType;
  icon: string;
  label: string;
}

const SERVICES: ServiceOption[] = [
  { value: "FLIGHT",    icon: "flight",         label: "Find Cheap Flights" },
  { value: "HOTEL",     icon: "hotel",           label: "Discover Hotels" },
  { value: "CAR",       icon: "directions_car",  label: "Rent a Car" },
  { value: "EXCURSION", icon: "explore",         label: "Explore Excursions" },
];

interface ServiceCheckboxProps {
  selected: ServiceType[];
  onChange: (services: ServiceType[]) => void;
}

export function ServiceCheckbox({ selected, onChange }: ServiceCheckboxProps) {
  function toggle(value: ServiceType) {
    const next = selected.includes(value)
      ? selected.filter((s) => s !== value)
      : [...selected, value];
    if (next.length > 0) onChange(next);
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {SERVICES.map((svc) => {
        const active = selected.includes(svc.value);
        return (
          <button
            key={svc.value}
            type="button"
            onClick={() => toggle(svc.value)}
            aria-pressed={active}
            className={cn(
              "flex flex-col items-start gap-3 px-4 py-4 rounded-lg border-2 text-left transition-all",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
              active
                ? "border-primary bg-cream-light"
                : "border-hairline bg-canvas hover:border-primary",
            )}
          >
            <div className="flex items-center justify-between w-full">
              <span
                className={cn("material-symbols-outlined", active ? "text-primary" : "text-steel")}
                style={{ fontSize: 22, fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}
                aria-hidden="true"
              >
                {svc.icon}
              </span>
              {/* Checkbox indicator */}
              <span
                className={cn(
                  "flex items-center justify-center w-5 h-5 rounded border-2 transition-colors shrink-0",
                  active
                    ? "bg-primary border-primary text-white"
                    : "border-hairline-strong bg-canvas",
                )}
              >
                {active && (
                  <span className="material-symbols-outlined" style={{ fontSize: 13 }} aria-hidden="true">check</span>
                )}
              </span>
            </div>
            <span
              className="text-ink"
              style={{ fontFamily: "var(--font-inter)", fontSize: "13px", fontWeight: 500, lineHeight: "1.4" }}
            >
              {svc.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
