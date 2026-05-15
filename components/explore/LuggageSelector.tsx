"use client";

import { cn } from "@/lib/utils/cn";

interface LuggageSelectorProps {
  handLuggage: number;
  checkedLuggage: number;
  specialLuggage: boolean;
  onChangeHand: (n: number) => void;
  onChangeChecked: (n: number) => void;
  onChangeSpecial: (v: boolean) => void;
}

function BagCounter({
  label,
  sub,
  icon,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  sub: string;
  icon: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 border-b border-outline-variant last:border-0">
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-[24px] text-on-surface-variant" aria-hidden="true">
          {icon}
        </span>
        <div className="flex flex-col gap-0.5">
          <span style={{ fontFamily: "var(--font-inter)", fontSize: "16px", fontWeight: 600, lineHeight: "1.4" }}>
            {label}
          </span>
          <span
            className="text-on-surface-variant"
            style={{ fontFamily: "var(--font-inter)", fontSize: "13px", lineHeight: "1.3" }}
          >
            {sub}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={() => onChange(value - 1)}
          disabled={value <= min}
          aria-label={`Decrease ${label}`}
          className={cn(
            "w-9 h-9 rounded-full border-2 flex items-center justify-center transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            value <= min
              ? "border-outline-variant text-on-surface-variant opacity-40 cursor-not-allowed"
              : "border-primary text-primary hover:bg-primary hover:text-on-primary cursor-pointer",
          )}
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">remove</span>
        </button>
        <span
          className="w-6 text-center"
          style={{ fontFamily: "var(--font-inter)", fontSize: "20px", fontWeight: 700, lineHeight: "1" }}
          aria-live="polite"
        >
          {value}
        </span>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          disabled={value >= max}
          aria-label={`Increase ${label}`}
          className={cn(
            "w-9 h-9 rounded-full border-2 flex items-center justify-center transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            value >= max
              ? "border-outline-variant text-on-surface-variant opacity-40 cursor-not-allowed"
              : "border-primary text-primary hover:bg-primary hover:text-on-primary cursor-pointer",
          )}
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">add</span>
        </button>
      </div>
    </div>
  );
}

export function LuggageSelector({
  handLuggage,
  checkedLuggage,
  specialLuggage,
  onChangeHand,
  onChangeChecked,
  onChangeSpecial,
}: LuggageSelectorProps) {
  return (
    <div className="flex flex-col gap-0 bg-surface-container-low border border-outline-variant rounded-2xl px-5">
      <BagCounter
        label="Hand luggage"
        sub="Fits in overhead bin"
        icon="backpack"
        value={handLuggage}
        min={0}
        max={9}
        onChange={onChangeHand}
      />
      <BagCounter
        label="Checked bags"
        sub="Checked into hold"
        icon="luggage"
        value={checkedLuggage}
        min={0}
        max={9}
        onChange={onChangeChecked}
      />

      {/* Special luggage toggle */}
      <div className="flex items-center justify-between gap-4 py-4">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-[24px] text-on-surface-variant" aria-hidden="true">
            sports_tennis
          </span>
          <div className="flex flex-col gap-0.5">
            <span style={{ fontFamily: "var(--font-inter)", fontSize: "16px", fontWeight: 600, lineHeight: "1.4" }}>
              Special luggage
            </span>
            <span
              className="text-on-surface-variant"
              style={{ fontFamily: "var(--font-inter)", fontSize: "13px", lineHeight: "1.3" }}
            >
              Bike, surfboard, golf clubs…
            </span>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={specialLuggage}
          onClick={() => onChangeSpecial(!specialLuggage)}
          className={cn(
            "relative inline-flex h-7 w-12 shrink-0 rounded-full border-2 transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 cursor-pointer",
            specialLuggage ? "bg-primary border-primary" : "bg-surface-container border-outline-variant",
          )}
          aria-label="Toggle special luggage"
        >
          <span
            className={cn(
              "pointer-events-none inline-block h-5 w-5 rounded-full bg-surface shadow-sm transition-transform mt-[1px]",
              specialLuggage ? "translate-x-[22px]" : "translate-x-[1px]",
            )}
          />
        </button>
      </div>
    </div>
  );
}
