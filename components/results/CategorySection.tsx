"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import type { NormalizedResult, AiSlot } from "@/types/search";
import type { ServiceType } from "@/types/trip";
import { FlightCard } from "./FlightCard";
import { HotelCard } from "./HotelCard";
import { CarCard } from "./CarCard";
import { ExcursionCard } from "./ExcursionCard";

// ─── Titles ───────────────────────────────────────────────────────────────────

const TITLES: Record<ServiceType, string> = {
  FLIGHT:    "Flights",
  HOTEL:     "Hotels",
  CAR:       "Car rentals",
  EXCURSION: "Excursions",
};

// ─── Sort tabs per category (pill-tab spec) ───────────────────────────────────

type SortKey = "rank" | "price" | "duration" | "rating" | "central" | "nearest" | "hidden";

interface SortOption { key: SortKey; label: string }

const SORT_OPTIONS: Record<ServiceType, SortOption[]> = {
  FLIGHT: [
    { key: "rank",     label: "Best Match" },
    { key: "price",    label: "Cheapest" },
    { key: "duration", label: "Fastest" },
  ],
  HOTEL: [
    { key: "rank",    label: "Best Match" },
    { key: "price",   label: "Cheapest" },
    { key: "rating",  label: "Best Rating" },
    { key: "central", label: "Most Central" },
  ],
  CAR: [
    { key: "rank",    label: "Best Match" },
    { key: "price",   label: "Cheapest" },
    { key: "nearest", label: "Nearest Pickup" },
  ],
  EXCURSION: [
    { key: "rank",   label: "Best Match" },
    { key: "price",  label: "Budget" },
    { key: "hidden", label: "Hidden Gems" },
  ],
};

// ─── Slot labels shown above each digest card ─────────────────────────────────

const DIGEST_SLOTS: Record<ServiceType, AiSlot[]> = {
  FLIGHT:    ["BEST_VALUE", "CHEAPEST", "FASTEST"],
  HOTEL:     ["BEST_VALUE", "CHEAPEST", "BEST_RATED"],
  CAR:       ["BEST_VALUE", "CHEAPEST", "CLOSEST_PICKUP"],
  EXCURSION: ["BEST_EXPERIENCE", "MUST_SEE", "HIDDEN_GEM"],
};

const SLOT_DISPLAY_LABELS: Record<string, string> = {
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

// ─── Sort the FULL results array by key, return top N ─────────────────────────

function applySortKey(results: NormalizedResult[], key: SortKey): NormalizedResult[] {
  const arr = [...results];
  switch (key) {
    case "price":
      return arr.sort((a, b) => a.priceEur - b.priceEur);
    case "duration":
      return arr.sort((a, b) =>
        (a.flight?.durationMinutes ?? 999999) - (b.flight?.durationMinutes ?? 999999),
      );
    case "rating":
      return arr.sort((a, b) => (b.hotel?.rating ?? 0) - (a.hotel?.rating ?? 0));
    case "central":
      return arr.sort((a, b) =>
        (a.hotel?.distanceFromCenterKm ?? 999) - (b.hotel?.distanceFromCenterKm ?? 999),
      );
    case "nearest":
      // No distance field in CarDetails; fall back to rank order
      return arr.sort((a, b) => a.rank - b.rank);
    case "hidden": {
      const gems = arr.filter((x) => x.aiSlot === "HIDDEN_GEM");
      const rest  = arr.filter((x) => x.aiSlot !== "HIDDEN_GEM").sort((a, b) => a.rank - b.rank);
      return [...gems, ...rest];
    }
    default: // "rank"
      return arr.sort((a, b) => a.rank - b.rank);
  }
}

// ─── Build the 3-item digest with AI-slot labels (when sort = rank) ──────────

function getDigestItems(
  sorted: NormalizedResult[],
  type: ServiceType,
  sortKey: SortKey,
): Array<{ result: NormalizedResult; label: string }> {
  if (sortKey !== "rank") {
    // Non-rank sort: just take the top 3 from the sorted list, no slot labels
    return sorted.slice(0, 3).map((result, i) => ({
      result,
      label: i === 0 ? "Top Pick" : i === 1 ? "Runner Up" : "Also Consider",
    }));
  }

  // Rank sort: match AI slots first, fall back to top-ranked un-used result
  const slots = DIGEST_SLOTS[type];
  const used  = new Set<string>();
  const items: Array<{ result: NormalizedResult; label: string }> = [];

  for (const slot of slots) {
    let r = sorted.find((x) => x.aiSlot === slot && !used.has(x.id));
    if (!r) r = sorted.find((x) => !used.has(x.id));
    if (r) {
      used.add(r.id);
      items.push({ result: r, label: SLOT_DISPLAY_LABELS[slot] ?? slot });
    }
  }
  return items;
}

function renderCard(result: NormalizedResult, tripId: string) {
  switch (result.serviceType) {
    case "FLIGHT":    return <FlightCard    key={result.id} result={result} tripId={tripId} />;
    case "HOTEL":     return <HotelCard     key={result.id} result={result} tripId={tripId} />;
    case "CAR":       return <CarCard       key={result.id} result={result} tripId={tripId} />;
    case "EXCURSION": return <ExcursionCard key={result.id} result={result} tripId={tripId} />;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

interface CategorySectionProps {
  type: ServiceType;
  results: NormalizedResult[];
  tripId: string;
  error?: string;
}

export function CategorySection({ type, results, tripId, error }: CategorySectionProps) {
  const [sortKey,  setSortKey]  = useState<SortKey>("rank");
  const [expanded, setExpanded] = useState(false);
  const [page,     setPage]     = useState(1);

  const sortOptions = SORT_OPTIONS[type];

  // Apply sort to the full results list
  const allSorted   = applySortKey(results, sortKey);
  const digestItems = getDigestItems(allSorted, type, sortKey);
  const extraCount  = Math.max(0, allSorted.length - digestItems.length);

  // Expanded view: show PAGE_SIZE items at a time
  const expandedItems = allSorted.slice(0, page * PAGE_SIZE);
  const hasMorePages  = expandedItems.length < allSorted.length;

  function handleSortChange(key: SortKey) {
    setSortKey(key);
    // Reset expansion so user sees fresh top-3 after sort change
    setExpanded(false);
    setPage(1);
  }

  return (
    <section className="flex flex-col gap-3">

      {/* ── Sort pill tabs — ABOVE heading per spec ── */}
      <div className="flex flex-wrap gap-2" role="tablist" aria-label={`Sort ${TITLES[type]}`}>
        {sortOptions.map((opt) => {
          const active = sortKey === opt.key;
          return (
            <button
              key={opt.key}
              role="tab"
              type="button"
              aria-selected={active}
              onClick={() => handleSortChange(opt.key)}
              className={cn(
                "rounded-full border px-4 py-1.5 transition-colors text-sm font-medium",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
                active
                  ? "border-ink bg-ink text-on-dark"
                  : "border-hairline bg-canvas text-steel hover:border-primary hover:text-primary",
              )}
              style={{ fontFamily: "var(--font-inter)", fontSize: "13px", fontWeight: active ? 600 : 400 }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* ── Section heading ── */}
      <div className="flex items-center justify-between">
        <h2
          className="text-ink"
          style={{ fontFamily: "var(--font-inter)", fontSize: "22px", fontWeight: 500, lineHeight: "1.3" }}
        >
          {TITLES[type]}
        </h2>
        {results.length > 0 && (
          <span
            className="text-steel"
            style={{ fontFamily: "var(--font-inter)", fontSize: "13px" }}
          >
            {results.length} found
          </span>
        )}
      </div>

      {/* ── Error state ── */}
      {error && (
        <p
          className="rounded-lg px-4 py-3 text-sm"
          style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-hairline)", color: "var(--color-steel)" }}
        >
          {error}
        </p>
      )}

      {/* ── Empty state ── */}
      {digestItems.length === 0 && !error && (
        <p
          className="text-center rounded-lg px-5 py-8 border"
          style={{
            fontFamily: "var(--font-inter)",
            fontSize: "14px",
            color: "var(--color-steel)",
            backgroundColor: "var(--color-canvas)",
            borderColor: "var(--color-hairline-soft)",
          }}
        >
          No {TITLES[type].toLowerCase()} found for your search.
        </p>
      )}

      {/* ── Cards (digest or expanded) ── */}
      {digestItems.length > 0 && (
        <div className="flex flex-col gap-4">
          {!expanded
            ? digestItems.map(({ result, label }) => (
                <div key={result.id} className="flex flex-col gap-1.5">
                  <span
                    className="uppercase"
                    style={{
                      fontFamily: "var(--font-inter)",
                      fontSize: "11px",
                      fontWeight: 600,
                      letterSpacing: "1px",
                      color: "var(--color-stone)",
                    }}
                  >
                    {label}
                  </span>
                  {renderCard(result, tripId)}
                </div>
              ))
            : expandedItems.map((result) => renderCard(result, tripId))}
        </div>
      )}

      {/* ── Load more (while expanded) ── */}
      {expanded && hasMorePages && (
        <button
          type="button"
          onClick={() => setPage((p) => p + 1)}
          className="flex items-center justify-center gap-2 transition-colors w-full"
          style={{
            fontFamily: "var(--font-inter)",
            fontSize: "14px",
            fontWeight: 500,
            color: "var(--color-steel)",
            backgroundColor: "var(--color-canvas)",
            border: "1px solid var(--color-hairline)",
            borderRadius: "var(--rounded-md)",
            padding: "10px 20px",
          }}
        >
          Load more
          <span className="material-symbols-outlined" style={{ fontSize: 16 }} aria-hidden="true">
            expand_more
          </span>
        </button>
      )}

      {/* ── See more / Show less toggle ── */}
      {digestItems.length > 0 && (
        <button
          type="button"
          onClick={() => { setExpanded((e) => !e); setPage(1); }}
          className="flex items-center justify-center gap-2 transition-colors w-full"
          style={{
            fontFamily: "var(--font-inter)",
            fontSize: "14px",
            fontWeight: 500,
            color: "var(--color-ink)",
            backgroundColor: "var(--color-canvas)",
            border: "1px solid var(--color-hairline-strong)",
            borderRadius: "var(--rounded-md)",
            padding: "10px 20px",
          }}
        >
          {expanded ? (
            <>
              Show less
              <span className="material-symbols-outlined" style={{ fontSize: 16 }} aria-hidden="true">
                expand_less
              </span>
            </>
          ) : (
            <>
              See more results
              {extraCount > 0 && (
                <span
                  style={{
                    backgroundColor: "var(--color-cream-deeper)",
                    color: "var(--color-ink)",
                    borderRadius: "var(--rounded-full)",
                    padding: "2px 8px",
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                >
                  +{extraCount}
                </span>
              )}
              <span className="material-symbols-outlined" style={{ fontSize: 16 }} aria-hidden="true">
                expand_more
              </span>
            </>
          )}
        </button>
      )}
    </section>
  );
}
