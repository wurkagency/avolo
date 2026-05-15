"use client";

import { useState } from "react";
import type { NormalizedResult } from "@/types/search";

export interface FilterState {
  maxPrice: number | null;
  refundableOnly: boolean;
  riskLevels: string[];
  maxStops: number | null;
}

const DEFAULT_FILTERS: FilterState = {
  maxPrice: null,
  refundableOnly: false,
  riskLevels: [],
  maxStops: null,
};

interface FilterSidebarProps {
  results: NormalizedResult[];
  filters: FilterState;
  onChange: (f: FilterState) => void;
}

export function applyFilters(results: NormalizedResult[], filters: FilterState): NormalizedResult[] {
  return results.filter((r) => {
    if (filters.maxPrice !== null && r.priceEur > filters.maxPrice) return false;
    if (filters.refundableOnly && !r.isRefundable) return false;
    if (filters.riskLevels.length > 0 && !filters.riskLevels.includes(r.riskLevel)) return false;
    if (filters.maxStops !== null && r.flight && r.flight.stops > filters.maxStops) return false;
    return true;
  });
}

export { DEFAULT_FILTERS };

export function FilterSidebar({ results, filters, onChange }: FilterSidebarProps) {
  const maxPriceInSet = Math.ceil(Math.max(...results.map((r) => r.priceEur), 0) / 100) * 100;
  const hasFlights = results.some((r) => r.flight);

  function toggleRisk(level: string) {
    const next = filters.riskLevels.includes(level)
      ? filters.riskLevels.filter((l) => l !== level)
      : [...filters.riskLevels, level];
    onChange({ ...filters, riskLevels: next });
  }

  return (
    <aside className="flex flex-col gap-6 rounded-2xl border border-outline-variant bg-surface-container-low p-5">
      <div>
        <h3 className="text-sm font-semibold text-on-surface mb-3">Filters</h3>
      </div>

      {/* Price */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-on-surface-variant uppercase tracking-wide">
          Max price
        </label>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={0}
            max={maxPriceInSet || 5000}
            step={50}
            value={filters.maxPrice ?? (maxPriceInSet || 5000)}
            onChange={(e) => onChange({ ...filters, maxPrice: parseInt(e.target.value, 10) })}
            className="flex-1 accent-primary"
          />
          <span className="text-sm font-medium text-on-surface w-16 text-right">
            {filters.maxPrice !== null ? `€${filters.maxPrice}` : "Any"}
          </span>
        </div>
        {filters.maxPrice !== null && (
          <button
            onClick={() => onChange({ ...filters, maxPrice: null })}
            className="text-xs text-primary hover:underline self-start"
          >
            Clear
          </button>
        )}
      </div>

      {/* Risk level */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-on-surface-variant uppercase tracking-wide">Risk level</p>
        <div className="flex flex-col gap-1.5">
          {(["LOW", "MEDIUM", "HIGH"] as const).map((level) => (
            <label key={level} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.riskLevels.includes(level)}
                onChange={() => toggleRisk(level)}
                className="accent-primary"
              />
              <span className="text-sm text-on-surface capitalize">{level.toLowerCase()} risk</span>
            </label>
          ))}
        </div>
      </div>

      {/* Refundable */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={filters.refundableOnly}
          onChange={(e) => onChange({ ...filters, refundableOnly: e.target.checked })}
          className="accent-primary"
        />
        <span className="text-sm text-on-surface">Refundable only</span>
      </label>

      {/* Stops (flights only) */}
      {hasFlights && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-on-surface-variant uppercase tracking-wide">Max stops</p>
          <div className="flex gap-2">
            {[0, 1, 2].map((n) => (
              <button
                key={n}
                onClick={() => onChange({ ...filters, maxStops: filters.maxStops === n ? null : n })}
                className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                  filters.maxStops === n
                    ? "bg-primary text-white border-primary"
                    : "border-outline-variant text-on-surface hover:bg-surface-container"
                }`}
              >
                {n === 0 ? "Non-stop" : n === 1 ? "1 stop" : "2+ stops"}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Reset */}
      <button
        onClick={() => onChange(DEFAULT_FILTERS)}
        className="text-xs text-on-surface-variant hover:text-primary hover:underline self-start"
      >
        Reset all filters
      </button>
    </aside>
  );
}
