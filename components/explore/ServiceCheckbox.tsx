"use client";

import { cn } from "@/lib/utils/cn";
import type { ServiceType } from "@/types/trip";

interface ServiceOption {
  value: ServiceType;
  icon: string;
  label: string;
  sub: string;
}

const SERVICES: ServiceOption[] = [
  { value: "FLIGHT", icon: "flight", label: "Flights", sub: "Search all airlines" },
  { value: "HOTEL", icon: "hotel", label: "Hotels", sub: "Best available rates" },
  { value: "CAR", icon: "directions_car", label: "Car rental", sub: "Pick up at destination" },
  { value: "EXCURSION", icon: "tour", label: "Excursions", sub: "Tours & activities" },
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
    // Require at least one service
    if (next.length > 0) onChange(next);
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {SERVICES.map((svc) => {
        const active = selected.includes(svc.value);
        return (
          <button
            key={svc.value}
            type="button"
            onClick={() => toggle(svc.value)}
            aria-pressed={active}
            className={cn(
              "flex flex-col gap-2 p-5 rounded-lg border-2 text-left transition-all",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
              active
                ? "border-primary bg-cream-light text-ink-tint"
                : "border-hairline bg-surface hover:border-primary text-ink",
            )}
          >
            <span
              className={cn("material-symbols-outlined text-[28px]", active ? "text-primary" : "text-steel")}
              style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}
              aria-hidden="true"
            >
              {svc.icon}
            </span>
            <div className="flex flex-col gap-0.5">
              <span style={{ fontFamily: "var(--font-inter)", fontSize: "16px", fontWeight: 600, lineHeight: "1.4" }}>
                {svc.label}
              </span>
              <span
                className="text-steel"
                style={{ fontFamily: "var(--font-inter)", fontSize: "13px", lineHeight: "1.3" }}
              >
                {svc.sub}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
