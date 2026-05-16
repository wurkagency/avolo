"use client";

import { cn } from "@/lib/utils/cn";

interface TravelerCounterProps {
  adults: number;
  childAges: number[];
  hasDisability: boolean;
  onChangeAdults: (n: number) => void;
  onChangeChildren: (ages: number[]) => void;
  onChangeDisability: (v: boolean) => void;
}

function Counter({
  label,
  sub,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  sub?: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 border-b border-hairline last:border-0">
      <div className="flex flex-col gap-0.5">
        <span style={{ fontFamily: "var(--font-inter)", fontSize: "16px", fontWeight: 600, lineHeight: "1.4" }}>
          {label}
        </span>
        {sub && (
          <span
            className="text-steel"
            style={{ fontFamily: "var(--font-inter)", fontSize: "13px", lineHeight: "1.3" }}
          >
            {sub}
          </span>
        )}
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
              ? "border-hairline text-steel opacity-40 cursor-not-allowed"
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
              ? "border-hairline text-steel opacity-40 cursor-not-allowed"
              : "border-primary text-primary hover:bg-primary hover:text-on-primary cursor-pointer",
          )}
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">add</span>
        </button>
      </div>
    </div>
  );
}

const CHILD_AGES = Array.from({ length: 18 }, (_, i) => i); // 0–17

export function TravelerCounter({
  adults,
  childAges,
  hasDisability,
  onChangeAdults,
  onChangeChildren,
  onChangeDisability,
}: TravelerCounterProps) {
  function addChild() {
    onChangeChildren([...childAges, 0]);
  }

  function removeChild() {
    onChangeChildren(childAges.slice(0, -1));
  }

  function setChildAge(index: number, age: number) {
    const next = [...childAges];
    next[index] = age;
    onChangeChildren(next);
  }

  return (
    <div className="flex flex-col gap-0 bg-canvas border border-hairline rounded-lg px-5">
      <Counter label="Adults" sub="18+ years" value={adults} min={1} max={9} onChange={onChangeAdults} />
      <Counter
        label="Children"
        sub="0–17 years"
        value={childAges.length}
        min={0}
        max={8}
        onChange={(n) => {
          if (n > childAges.length) addChild();
          else removeChild();
        }}
      />

      {/* Per-child age selects */}
      {childAges.length > 0 && (
        <div className="flex flex-wrap gap-3 pb-4 pt-1">
          {childAges.map((age, i) => (
            <div key={i} className="flex flex-col gap-1">
              <label
                htmlFor={`child-age-${i}`}
                className="text-steel uppercase tracking-widest"
                style={{ fontFamily: "var(--font-inter)", fontSize: "11px", fontWeight: 600 }}
              >
                Child {i + 1}
              </label>
              <select
                id={`child-age-${i}`}
                value={age}
                onChange={(e) => setChildAge(i, parseInt(e.target.value, 10))}
                className={cn(
                  "bg-surface border border-hairline rounded-lg px-3 py-2 text-ink",
                  "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
                )}
                style={{ fontFamily: "var(--font-inter)", fontSize: "14px" }}
                aria-label={`Age of child ${i + 1}`}
              >
                {CHILD_AGES.map((a) => (
                  <option key={a} value={a}>
                    {a === 0 ? "Under 1" : `${a} yr${a !== 1 ? "s" : ""}`}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}

      {/* Disability / reduced mobility */}
      <div className="flex items-center justify-between gap-4 py-4">
        <div className="flex flex-col gap-0.5">
          <span style={{ fontFamily: "var(--font-inter)", fontSize: "16px", fontWeight: 600, lineHeight: "1.4" }}>
            Reduced mobility
          </span>
          <span
            className="text-steel"
            style={{ fontFamily: "var(--font-inter)", fontSize: "13px", lineHeight: "1.3" }}
          >
            Wheelchair or assistance needed
          </span>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={hasDisability}
          onClick={() => onChangeDisability(!hasDisability)}
          className={cn(
            "relative inline-flex h-7 w-12 shrink-0 rounded-full border-2 transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 cursor-pointer",
            hasDisability ? "bg-primary border-primary" : "bg-surface border-hairline",
          )}
          aria-label="Toggle reduced mobility"
        >
          <span
            className={cn(
              "pointer-events-none inline-block h-5 w-5 rounded-full bg-surface shadow-sm transition-transform mt-[1px]",
              hasDisability ? "translate-x-[22px]" : "translate-x-[1px]",
            )}
          />
        </button>
      </div>
    </div>
  );
}
