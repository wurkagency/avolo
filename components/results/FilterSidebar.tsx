"use client";

import type { NormalizedResult } from "@/types/search";

export interface FilterState {
  maxPrice: number | null;
  refundableOnly: boolean;
  riskLevels: string[];
  sortBy: "rank" | "price_asc" | "price_desc";
  // Flight
  maxStops: number | null;
  // Hotel
  minStars: number | null;
  maxDistanceKm: number | null;
  breakfastOnly: boolean;
  // Car
  carCategories: string[];
  // Excursion
  excursionCategories: string[];
  maxDurationHours: number | null;
}

export const DEFAULT_FILTERS: FilterState = {
  maxPrice: null,
  refundableOnly: false,
  riskLevels: [],
  sortBy: "rank",
  maxStops: null,
  minStars: null,
  maxDistanceKm: null,
  breakfastOnly: false,
  carCategories: [],
  excursionCategories: [],
  maxDurationHours: null,
};

export function applyFilters(results: NormalizedResult[], filters: FilterState): NormalizedResult[] {
  let out = results.filter((r) => {
    if (filters.maxPrice !== null && r.priceEur > filters.maxPrice) return false;
    if (filters.refundableOnly && !r.isRefundable) return false;
    if (filters.riskLevels.length > 0 && !filters.riskLevels.includes(r.riskLevel)) return false;
    if (filters.maxStops !== null && r.flight && r.flight.stops > filters.maxStops) return false;
    if (filters.minStars !== null && r.hotel && r.hotel.stars < filters.minStars) return false;
    if (filters.maxDistanceKm !== null && r.hotel?.distanceFromCenterKm !== null && r.hotel?.distanceFromCenterKm !== undefined && r.hotel.distanceFromCenterKm > filters.maxDistanceKm) return false;
    if (filters.breakfastOnly && r.hotel && !r.hotel.breakfast) return false;
    if (filters.carCategories.length > 0 && r.car && !filters.carCategories.includes(r.car.category)) return false;
    if (filters.excursionCategories.length > 0 && r.excursion && !filters.excursionCategories.includes(r.excursion.category)) return false;
    if (filters.maxDurationHours !== null && r.excursion && r.excursion.durationHours > filters.maxDurationHours) return false;
    return true;
  });

  if (filters.sortBy === "price_asc") out = out.sort((a, b) => a.priceEur - b.priceEur);
  else if (filters.sortBy === "price_desc") out = out.sort((a, b) => b.priceEur - a.priceEur);
  else out = out.sort((a, b) => a.rank - b.rank);

  return out;
}

interface FilterSidebarProps {
  results: NormalizedResult[];
  filters: FilterState;
  onChange: (f: FilterState) => void;
}

function CheckGroup({ label, options, checked, onToggle }: {
  label: string;
  options: string[];
  checked: string[];
  onToggle: (v: string) => void;
}) {
  if (options.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium text-steel uppercase tracking-wide">{label}</p>
      <div className="flex flex-col gap-1.5">
        {options.map((opt) => (
          <label key={opt} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={checked.includes(opt)}
              onChange={() => onToggle(opt)}
              className="accent-primary"
            />
            <span className="text-sm text-ink capitalize">{opt.toLowerCase().replace(/_/g, " ")}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

export function FilterSidebar({ results, filters, onChange }: FilterSidebarProps) {
  const maxPriceInSet = Math.ceil(Math.max(...results.map((r) => r.priceEur), 0) / 100) * 100;

  const hasFlights = results.some((r) => r.flight);
  const hasHotels = results.some((r) => r.hotel);
  const hasCars = results.some((r) => r.car);
  const hasExcursions = results.some((r) => r.excursion);

  const carCategories = Array.from(new Set(results.flatMap((r) => r.car ? [r.car.category] : [])));
  const excursionCategories = Array.from(new Set(results.flatMap((r) => r.excursion ? [r.excursion.category] : [])));

  function toggle<K extends keyof FilterState>(key: K, arr: string[], val: string) {
    const next = arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];
    onChange({ ...filters, [key]: next });
  }

  return (
    <aside className="flex flex-col gap-5 rounded-lg border border-hairline bg-canvas p-5">
      <h3 className="text-sm font-semibold text-ink">Filters</h3>

      {/* Sort */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-steel uppercase tracking-wide">Sort by</p>
        <select
          value={filters.sortBy}
          onChange={(e) => onChange({ ...filters, sortBy: e.target.value as FilterState["sortBy"] })}
          className="rounded-xl border border-hairline bg-surface px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="rank">Best match</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
        </select>
      </div>

      {/* Price */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-steel uppercase tracking-wide">Max price</p>
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
          <span className="text-sm font-medium text-ink w-16 text-right">
            {filters.maxPrice !== null ? `€${filters.maxPrice}` : "Any"}
          </span>
        </div>
        {filters.maxPrice !== null && (
          <button onClick={() => onChange({ ...filters, maxPrice: null })} className="text-xs text-primary hover:underline self-start">Clear</button>
        )}
      </div>

      {/* Refundable */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={filters.refundableOnly} onChange={(e) => onChange({ ...filters, refundableOnly: e.target.checked })} className="accent-primary" />
        <span className="text-sm text-ink">Refundable only</span>
      </label>

      {/* Risk */}
      <CheckGroup
        label="Risk level"
        options={["LOW", "MEDIUM", "HIGH"]}
        checked={filters.riskLevels}
        onToggle={(v) => toggle("riskLevels", filters.riskLevels, v)}
      />

      {/* Flight filters */}
      {hasFlights && (
        <div className="flex flex-col gap-3 border-t border-hairline pt-4">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest">Flights</p>
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-steel uppercase tracking-wide">Max stops</p>
            <div className="flex gap-2 flex-wrap">
              {[0, 1, 2].map((n) => (
                <button
                  key={n}
                  onClick={() => onChange({ ...filters, maxStops: filters.maxStops === n ? null : n })}
                  className={`rounded-md px-3 py-1 text-xs font-medium border transition-colors ${filters.maxStops === n ? "bg-primary text-white border-primary" : "border-hairline text-ink hover:bg-surface"}`}
                >
                  {n === 0 ? "Non-stop" : n === 1 ? "1 stop" : "2+ stops"}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Hotel filters */}
      {hasHotels && (
        <div className="flex flex-col gap-3 border-t border-hairline pt-4">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest">Hotels</p>
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-steel uppercase tracking-wide">Min stars</p>
            <div className="flex gap-2 flex-wrap">
              {[3, 4, 5].map((s) => (
                <button
                  key={s}
                  onClick={() => onChange({ ...filters, minStars: filters.minStars === s ? null : s })}
                  className={`rounded-md px-3 py-1 text-xs font-medium border transition-colors ${filters.minStars === s ? "bg-primary text-white border-primary" : "border-hairline text-ink hover:bg-surface"}`}
                >
                  {"★".repeat(s)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-steel uppercase tracking-wide">Max distance to centre</p>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={10}
                step={0.5}
                value={filters.maxDistanceKm ?? 10}
                onChange={(e) => onChange({ ...filters, maxDistanceKm: parseFloat(e.target.value) })}
                className="flex-1 accent-primary"
              />
              <span className="text-sm w-14 text-right">{filters.maxDistanceKm !== null ? `${filters.maxDistanceKm} km` : "Any"}</span>
            </div>
            {filters.maxDistanceKm !== null && (
              <button onClick={() => onChange({ ...filters, maxDistanceKm: null })} className="text-xs text-primary hover:underline self-start">Clear</button>
            )}
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={filters.breakfastOnly} onChange={(e) => onChange({ ...filters, breakfastOnly: e.target.checked })} className="accent-primary" />
            <span className="text-sm text-ink">Breakfast included</span>
          </label>
        </div>
      )}

      {/* Car filters */}
      {hasCars && (
        <div className="flex flex-col gap-3 border-t border-hairline pt-4">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest">Car Rental</p>
          <CheckGroup
            label="Car type"
            options={carCategories}
            checked={filters.carCategories}
            onToggle={(v) => toggle("carCategories", filters.carCategories, v)}
          />
        </div>
      )}

      {/* Excursion filters */}
      {hasExcursions && (
        <div className="flex flex-col gap-3 border-t border-hairline pt-4">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest">Excursions</p>
          <CheckGroup
            label="Category"
            options={excursionCategories}
            checked={filters.excursionCategories}
            onToggle={(v) => toggle("excursionCategories", filters.excursionCategories, v)}
          />
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-steel uppercase tracking-wide">Max duration</p>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={1}
                max={24}
                step={1}
                value={filters.maxDurationHours ?? 24}
                onChange={(e) => onChange({ ...filters, maxDurationHours: parseInt(e.target.value, 10) })}
                className="flex-1 accent-primary"
              />
              <span className="text-sm w-14 text-right">{filters.maxDurationHours !== null ? `${filters.maxDurationHours}h` : "Any"}</span>
            </div>
            {filters.maxDurationHours !== null && (
              <button onClick={() => onChange({ ...filters, maxDurationHours: null })} className="text-xs text-primary hover:underline self-start">Clear</button>
            )}
          </div>
        </div>
      )}

      <button
        onClick={() => onChange(DEFAULT_FILTERS)}
        className="text-xs text-steel hover:text-primary hover:underline self-start"
      >
        Reset all filters
      </button>
    </aside>
  );
}
