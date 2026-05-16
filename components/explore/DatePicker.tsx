"use client";

import { useState, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils/cn";
import type { Flexibility } from "@/types/trip";

interface DatePickerProps {
  departureDate: string | null;
  returnDate: string | null;
  isOneWay: boolean;
  flexibility: Flexibility;
  onChangeDates: (departure: string, returnDate: string | null, isOneWay: boolean) => void;
  onChangeFlexibility: (f: Flexibility) => void;
}

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

const FLEXIBILITY_OPTIONS: { value: Flexibility; label: string; sub: string }[] = [
  { value: "EXACT", label: "Exact dates", sub: "No change" },
  { value: "PLUS_MINUS_1", label: "± 1 day", sub: "Flexible range" },
  { value: "PLUS_MINUS_3", label: "± 3 days", sub: "Best value" },
  { value: "PLUS_MINUS_7", label: "± 7 days", sub: "Maximum savings" },
];

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addMonths(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(1);
  d.setMonth(d.getMonth() + n);
  return d;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/** Returns 0 (Mon)–6 (Sun) for ISO week */
function isoWeekday(date: Date): number {
  return (date.getDay() + 6) % 7;
}

function parseIso(s: string | null): Date | null {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  if (!y || m === undefined || d === undefined) return null;
  return new Date(y, m - 1, d);
}

export function DatePicker({
  departureDate,
  returnDate,
  isOneWay,
  flexibility,
  onChangeDates,
  onChangeFlexibility,
}: DatePickerProps) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Month navigation: show two consecutive months starting from viewMonth
  const [viewMonth, setViewMonth] = useState<Date>(() => {
    const base = departureDate ? parseIso(departureDate) ?? today : today;
    const d = startOfMonth(base);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  // During selection: first click sets hover candidate for range preview
  const [hoverDate, setHoverDate] = useState<string | null>(null);
  // Track selection phase: "departure" | "return" when in return-trip mode
  const [phase, setPhase] = useState<"departure" | "return">("departure");

  const month1 = viewMonth;
  const month2 = addMonths(viewMonth, 1);

  const selectedDep = parseIso(departureDate);
  const selectedRet = isOneWay ? null : parseIso(returnDate);

  const handleDayClick = useCallback(
    (dateStr: string) => {
      const clicked = parseIso(dateStr)!;
      if (clicked < today) return; // past date — no-op

      if (isOneWay) {
        onChangeDates(dateStr, null, true);
        return;
      }

      if (phase === "departure") {
        // Reset selection to just departure; clear return
        onChangeDates(dateStr, null, false);
        setPhase("return");
        setHoverDate(null);
      } else {
        // Return phase: if clicked before departure, swap them
        if (selectedDep && clicked < selectedDep) {
          onChangeDates(dateStr, departureDate, false);
        } else {
          onChangeDates(departureDate ?? dateStr, dateStr, false);
        }
        setPhase("departure");
        setHoverDate(null);
      }
    },
    [isOneWay, phase, today, selectedDep, departureDate, onChangeDates],
  );

  const handleDayHover = useCallback(
    (dateStr: string) => {
      if (phase === "return" && !isOneWay) {
        setHoverDate(dateStr);
      }
    },
    [phase, isOneWay],
  );

  function isInRange(dateStr: string): boolean {
    if (isOneWay) return false;
    const d = parseIso(dateStr);
    if (!d || !selectedDep) return false;
    const rangeEnd = selectedRet ?? parseIso(hoverDate);
    if (!rangeEnd) return false;
    const start = selectedDep < rangeEnd ? selectedDep : rangeEnd;
    const end = selectedDep < rangeEnd ? rangeEnd : selectedDep;
    return d > start && d < end;
  }

  function isDeparture(dateStr: string): boolean {
    return departureDate === dateStr;
  }

  function isReturn(dateStr: string): boolean {
    if (isOneWay) return false;
    const eff = returnDate ?? hoverDate;
    return eff === dateStr;
  }

  function isPast(dateStr: string): boolean {
    const d = parseIso(dateStr);
    return d !== null && d < today;
  }

  function renderMonth(monthStart: Date) {
    const year = monthStart.getFullYear();
    const month = monthStart.getMonth();
    const totalDays = daysInMonth(year, month);
    const firstWeekday = isoWeekday(monthStart); // 0=Mon…6=Sun

    const cells: Array<{ dateStr: string | null; day: number | null }> = [];

    // Leading empty cells
    for (let i = 0; i < firstWeekday; i++) {
      cells.push({ dateStr: null, day: null });
    }

    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({ dateStr, day: d });
    }

    const monthName = monthStart.toLocaleDateString("en-US", { month: "long", year: "numeric" });

    return (
      <div key={`${year}-${month}`} className="flex flex-col gap-3 flex-1 min-w-0">
        {/* Month header */}
        <div
          className="text-ink font-bold"
          style={{ fontFamily: "var(--font-inter)", fontSize: "16px", lineHeight: "1.5" }}
        >
          {monthName}
        </div>

        {/* Weekday labels */}
        <div className="grid grid-cols-7 text-center gap-y-1">
          {WEEKDAYS.map((wd) => (
            <div
              key={wd}
              className="text-steel"
              style={{ fontFamily: "var(--font-inter)", fontSize: "12px", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", paddingBottom: "4px" }}
            >
              {wd}
            </div>
          ))}

          {/* Day cells */}
          {cells.map((cell, i) => {
            if (!cell.dateStr || cell.day === null) {
              return <div key={`empty-${i}`} />;
            }

            const dep = isDeparture(cell.dateStr);
            const ret = isReturn(cell.dateStr);
            const inRange = isInRange(cell.dateStr);
            const past = isPast(cell.dateStr);
            const isToday = cell.dateStr === isoDate(today);

            return (
              <button
                key={cell.dateStr}
                type="button"
                disabled={past}
                onClick={() => handleDayClick(cell.dateStr!)}
                onMouseEnter={() => handleDayHover(cell.dateStr!)}
                className={cn(
                  "relative py-2.5 text-center transition-colors rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  past && "text-muted cursor-not-allowed",
                  !past && !dep && !ret && !inRange && "hover:bg-surface cursor-pointer text-ink",
                  dep && "bg-primary text-on-primary font-bold rounded-lg cursor-pointer",
                  ret && "bg-primary-fixed-dim text-primary font-bold rounded-lg cursor-pointer",
                  inRange && !dep && !ret && "bg-primary-fixed text-primary rounded-none cursor-pointer",
                  isToday && !dep && !ret && "underline underline-offset-2",
                )}
                style={{ fontFamily: "var(--font-inter)", fontSize: "14px", lineHeight: "1" }}
                aria-label={`${cell.dateStr}${dep ? " (departure)" : ret ? " (return)" : ""}`}
                aria-pressed={dep || ret}
              >
                {cell.day}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* One-way / Return toggle */}
      <div className="flex items-center gap-1 bg-surface rounded-full p-1 self-start">
        {(["return", "one-way"] as const).map((mode) => {
          const active = mode === "one-way" ? isOneWay : !isOneWay;
          return (
            <button
              key={mode}
              type="button"
              onClick={() => {
                const oneWay = mode === "one-way";
                onChangeDates(departureDate ?? "", oneWay ? null : returnDate, oneWay);
                if (!oneWay) setPhase(departureDate ? "return" : "departure");
              }}
              className={cn(
                "px-5 py-2 rounded-full transition-all capitalize",
                active
                  ? "bg-surface text-ink shadow-sm"
                  : "text-steel hover:text-ink",
              )}
              style={{ fontFamily: "var(--font-inter)", fontSize: "14px", fontWeight: active ? 600 : 400 }}
            >
              {mode}
            </button>
          );
        })}
      </div>

      {/* Calendar — two months side by side on md+, stacked on mobile */}
      <div
        className="bg-canvas border border-hairline rounded-xl p-5"
        onMouseLeave={() => setHoverDate(null)}
      >
        {/* Navigation */}
        <div className="flex items-center justify-between mb-5">
          <button
            type="button"
            onClick={() => setViewMonth((m) => addMonths(m, -1))}
            disabled={viewMonth <= startOfMonth(today)}
            className="p-2 rounded-full hover:bg-surface transition-colors text-steel disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Previous month"
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">chevron_left</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMonth((m) => addMonths(m, 1))}
            className="p-2 rounded-full hover:bg-surface transition-colors text-steel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Next month"
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">chevron_right</span>
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {renderMonth(month1)}
          {renderMonth(month2)}
        </div>
      </div>

      {/* Flexibility chips */}
      <div className="flex flex-col gap-3">
        <span
          className="text-steel uppercase tracking-widest"
          style={{ fontFamily: "var(--font-inter)", fontSize: "12px", fontWeight: 600, letterSpacing: "0.1em" }}
        >
          Date flexibility
        </span>
        <div className="flex flex-wrap gap-3">
          {FLEXIBILITY_OPTIONS.map((opt) => {
            const selected = flexibility === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChangeFlexibility(opt.value)}
                className={cn(
                  "flex flex-col items-center justify-center px-5 py-3 min-w-[110px] rounded-xl border transition-all",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  selected
                    ? "border-primary bg-cream-light text-ink-tint"
                    : "border-hairline hover:border-primary text-ink",
                )}
              >
                <span style={{ fontFamily: "var(--font-inter)", fontSize: "15px", fontWeight: 600, lineHeight: "1.4" }}>
                  {opt.label}
                </span>
                <span style={{ fontFamily: "var(--font-inter)", fontSize: "11px", lineHeight: "1.3", opacity: 0.65 }}>
                  {opt.sub}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
