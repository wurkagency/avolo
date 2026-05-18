"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useId,
  type KeyboardEvent,
} from "react";
import { searchAirports } from "@/lib/api/airportsClient";
import type { AirportOption, TripDestination } from "@/types/trip";
import { cn } from "@/lib/utils/cn";

interface AutocompleteInputProps {
  label: string;
  placeholder?: string;
  value: TripDestination | null;
  onChange: (v: TripDestination | null) => void;
  /** Called when user presses Enter with a selected item OR submits via keyboard */
  onEnter?: () => void;
  autoFocus?: boolean;
  className?: string;
}

// Synthetic option representing "All airports near X"
interface AllAirportsOption {
  kind: "all-nearby";
  primaryIata: string;
  primaryCity: string;
  nearbyIatas: string[];
  label: string;
}

type DropdownItem =
  | { kind: "airport"; airport: AirportOption }
  | AllAirportsOption;

function formatLabel(airport: AirportOption): string {
  const city = airport.municipality ?? airport.name;
  return `${city} (${airport.iataCode})`;
}

async function fetchNearbyIatas(iata: string): Promise<string[]> {
  try {
    const res = await fetch(`/api/airports/nearby?iata=${iata}&radius=100`);
    if (!res.ok) return [];
    const data = await res.json() as { airports: AirportOption[] };
    return (data.airports ?? []).map((a) => a.iataCode);
  } catch {
    return [];
  }
}

export function AutocompleteInput({
  label,
  placeholder = "City or airport",
  value,
  onChange,
  onEnter,
  autoFocus,
  className,
}: AutocompleteInputProps) {
  const id = useId();
  const listboxId = `${id}-listbox`;

  const [inputValue, setInputValue] = useState(value ? formatLabel(toAirportOption(value)) : "");
  const [options, setOptions] = useState<AirportOption[]>([]);
  const [items, setItems] = useState<DropdownItem[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [loading, setLoading] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Sync input display value when external value changes
  useEffect(() => {
    if (value) {
      setInputValue(formatLabel(toAirportOption(value)));
    }
  }, [value]);

  const fetchOptions = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setOptions([]);
      setItems([]);
      setOpen(false);
      return;
    }

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    try {
      const results = await searchAirports(query, abortRef.current?.signal);
      setOptions(results);

      // Build dropdown items: individual airports + one "All nearby" option for the top match
      const dropdownItems: DropdownItem[] = results.map((a) => ({ kind: "airport" as const, airport: a }));

      // For the best match, asynchronously add a "All airports near X" option
      if (results.length > 0 && results[0]) {
        const topAirport = results[0];
        fetchNearbyIatas(topAirport.iataCode).then((nearbyIatas) => {
          if (nearbyIatas.length > 0) {
            const city = topAirport.municipality ?? topAirport.name;
            const allOption: AllAirportsOption = {
              kind: "all-nearby",
              primaryIata: topAirport.iataCode,
              primaryCity: city,
              nearbyIatas,
              label: `All airports near ${city} (${[topAirport.iataCode, ...nearbyIatas.slice(0, 3)].join(", ")}${nearbyIatas.length > 3 ? "…" : ""})`,
            };
            setItems((prev) => [allOption, ...prev.filter((i) => i.kind === "airport")]);
          }
        }).catch(() => null);
      }

      setItems(dropdownItems);
      setOpen(results.length > 0);
      setActiveIndex(-1);
    } catch {
      setOptions([]);
      setItems([]);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }, []);

  function handleInputChange(raw: string) {
    setInputValue(raw);
    if (value && raw !== formatLabel(toAirportOption(value))) {
      onChange(null);
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchOptions(raw), 200);
  }

  function selectOption(airport: AirportOption) {
    const dest: TripDestination = {
      iata: airport.iataCode,
      name: formatLabel(airport),
    };
    onChange(dest);
    setInputValue(formatLabel(airport));
    setOpen(false);
    setOptions([]);
    setItems([]);
    setActiveIndex(-1);
  }

  function selectAllNearby(opt: AllAirportsOption) {
    const dest: TripDestination = {
      iata: opt.primaryIata,
      name: `All airports near ${opt.primaryCity}`,
      nearbyIatas: opt.nearbyIatas,
    };
    onChange(dest);
    setInputValue(`All airports near ${opt.primaryCity}`);
    setOpen(false);
    setOptions([]);
    setItems([]);
    setActiveIndex(-1);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!open) {
      if (e.key === "Enter" && value) {
        e.preventDefault();
        onEnter?.();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, items.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, -1));
        break;
      case "Enter":
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < items.length) {
          const item = items[activeIndex];
          if (item?.kind === "airport") selectOption(item.airport);
          else if (item?.kind === "all-nearby") selectAllNearby(item);
        } else if (options.length === 1 && options[0]) {
          selectOption(options[0]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        setActiveIndex(-1);
        inputRef.current?.blur();
        break;
      case "Tab":
        setOpen(false);
        break;
    }
  }

  useEffect(() => {
    if (activeIndex < 0) return;
    const item = listRef.current?.children[activeIndex] as HTMLElement | undefined;
    item?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  // Close on outside click
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      abortRef.current?.abort();
    };
  }, []);

  const hasSelection = value !== null;

  return (
    <div ref={containerRef} className={cn("relative flex flex-col gap-1.5", className)}>
      <label
        htmlFor={id}
        className="text-steel uppercase tracking-widest"
        style={{ fontFamily: "var(--font-inter)", fontSize: "12px", fontWeight: 600, letterSpacing: "0.1em" }}
      >
        {label}
      </label>

      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={open ? listboxId : undefined}
          aria-activedescendant={
            activeIndex >= 0 ? `${id}-option-${activeIndex}` : undefined
          }
          type="text"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          inputMode="text"
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (options.length > 0) setOpen(true);
          }}
          autoFocus={autoFocus}
          className={cn(
            "w-full bg-canvas border rounded-xl px-4 py-4 pr-10",
            "transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
            hasSelection
              ? "border-primary text-ink"
              : "border-hairline text-ink",
            "placeholder:text-steel",
          )}
          style={{ fontFamily: "var(--font-inter)", fontSize: "20px", lineHeight: "1.6" }}
        />

        {/* Right icon: loading spinner or clear button */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
          {loading ? (
            <svg
              className="animate-spin h-5 w-5 text-steel"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          ) : hasSelection ? (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => {
                onChange(null);
                setInputValue("");
                setOptions([]);
                setOpen(false);
                inputRef.current?.focus();
              }}
              aria-label="Clear selection"
              className="text-steel hover:text-ink focus-visible:outline-none rounded"
            >
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">close</span>
            </button>
          ) : (
            <span className="material-symbols-outlined text-[20px] text-steel pointer-events-none" aria-hidden="true">
              flight
            </span>
          )}
        </div>
      </div>

      {/* Dropdown */}
      {open && items.length > 0 && (
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          aria-label={label}
          className="absolute top-full left-0 right-0 mt-1 z-50 bg-surface border border-hairline rounded-xl shadow-lg max-h-64 overflow-y-auto py-1"
        >
          {items.map((item, i) => {
            const isActive = i === activeIndex;
            if (item.kind === "all-nearby") {
              return (
                <li
                  key={`all-nearby-${item.primaryIata}`}
                  id={`${id}-option-${i}`}
                  role="option"
                  aria-selected={isActive}
                  onMouseDown={(e) => { e.preventDefault(); selectAllNearby(item); }}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-hairline",
                    isActive ? "bg-cream-light" : "hover:bg-canvas",
                  )}
                >
                  <span className="material-symbols-outlined text-[18px] text-primary shrink-0">travel_explore</span>
                  <div className="flex flex-col min-w-0">
                    <span className="text-primary font-medium truncate" style={{ fontFamily: "var(--font-inter)", fontSize: "14px" }}>
                      {item.label}
                    </span>
                    <span className="text-steel" style={{ fontFamily: "var(--font-inter)", fontSize: "12px" }}>
                      Search all nearby airports within 100 km
                    </span>
                  </div>
                </li>
              );
            }

            const { airport } = item;
            const city = airport.municipality ?? airport.name;
            return (
              <li
                key={airport.iataCode}
                id={`${id}-option-${i}`}
                role="option"
                aria-selected={isActive}
                onMouseDown={(e) => { e.preventDefault(); selectOption(airport); }}
                onMouseEnter={() => setActiveIndex(i)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors",
                  isActive ? "bg-cream-light text-primary" : "hover:bg-canvas",
                )}
              >
                <span
                  className="shrink-0 font-bold w-10 text-center text-primary"
                  style={{ fontFamily: "var(--font-inter)", fontSize: "12px", letterSpacing: "0.05em" }}
                >
                  {airport.iataCode}
                </span>

                <div className="flex flex-col min-w-0">
                  <span className="text-ink truncate" style={{ fontFamily: "var(--font-inter)", fontSize: "15px", lineHeight: "1.4" }}>
                    {city}
                  </span>
                  {city !== airport.name && (
                    <span className="text-steel truncate" style={{ fontFamily: "var(--font-inter)", fontSize: "13px", lineHeight: "1.3" }}>
                      {airport.name}
                    </span>
                  )}
                </div>

                <span className="ml-auto shrink-0 text-steel" style={{ fontFamily: "var(--font-inter)", fontSize: "12px" }}>
                  {airport.country}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function toAirportOption(dest: TripDestination): AirportOption {
  // Parse back "Paris (CDG)" → { iataCode: "CDG", municipality: "Paris", ... }
  const match = dest.name.match(/^(.+?)\s*\(([A-Z]{3})\)$/);
  return {
    iataCode: match?.[2] ?? dest.iata,
    name: match?.[1] ?? dest.name,
    municipality: match?.[1] ?? null,
    country: "",
  };
}
