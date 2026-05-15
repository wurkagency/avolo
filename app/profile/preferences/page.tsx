"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useUiStore } from "@/lib/state/uiStore";

interface Preferences {
  maxStops: number;
  travelType: string;
  cabin: string;
  flightStyle: string;
  hotelType: string;
  hotelLocation: string;
  carType: string;
  carInsurance: string;
  carPickupType: string;
  excursionBudget: string;
  excursionStyle: string[];
}

const DEFAULTS: Preferences = {
  maxStops: 2,
  travelType: "any",
  cabin: "economy",
  flightStyle: "cheapest",
  hotelType: "any",
  hotelLocation: "any",
  carType: "economy",
  carInsurance: "basic",
  carPickupType: "any",
  excursionBudget: "medium",
  excursionStyle: [],
};

type SaveStatus = "idle" | "saving" | "saved";

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-on-surface-variant uppercase tracking-wide">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-xl border border-outline-variant bg-surface px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

export default function PreferencesPage() {
  const addToast = useUiStore((s) => s.addToast);
  const [prefs, setPrefs] = useState<Preferences>(DEFAULTS);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [loading, setLoading] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialLoad = useRef(true);

  useEffect(() => {
    fetch("/api/profile/preferences")
      .then((r) => r.json())
      .then((data: Partial<Preferences>) => {
        setPrefs((prev) => ({ ...prev, ...data }));
      })
      .catch(() => addToast("Could not load preferences", "error"))
      .finally(() => setLoading(false));
  }, [addToast]);

  // Debounced PATCH — fires 500ms after last change
  const save = useCallback((updated: Preferences) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setSaveStatus("saving");
      try {
        const res = await fetch("/api/profile/preferences", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updated),
        });
        if (!res.ok) throw new Error("Save failed");
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
      } catch {
        addToast("Could not save preferences", "error");
        setSaveStatus("idle");
      }
    }, 500);
  }, [addToast]);

  function update<K extends keyof Preferences>(key: K, value: Preferences[K]) {
    setPrefs((prev) => {
      const next = { ...prev, [key]: value };
      // Skip autosave on initial data load
      if (!initialLoad.current) save(next);
      return next;
    });
  }

  // Mark initial load complete after first render with data
  useEffect(() => {
    if (!loading) initialLoad.current = false;
  }, [loading]);

  if (loading) {
    return (
      <div className="flex items-center gap-3 py-12 text-on-surface-variant">
        <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span>Loading preferences…</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-on-surface" style={{ fontFamily: "var(--font-manrope)" }}>
            Travel preferences
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">Changes are saved automatically.</p>
        </div>

        {saveStatus !== "idle" && (
          <span className={`text-sm font-medium ${saveStatus === "saved" ? "text-green-600" : "text-on-surface-variant"}`}>
            {saveStatus === "saving" ? "Saving…" : "Saved"}
          </span>
        )}
      </div>

      {/* Flights */}
      <section className="flex flex-col gap-4 rounded-2xl border border-outline-variant p-6">
        <h2 className="text-base font-semibold text-on-surface">Flights</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Select
            label="Max stops"
            value={String(prefs.maxStops)}
            options={[
              { value: "0", label: "Non-stop only" },
              { value: "1", label: "Up to 1 stop" },
              { value: "2", label: "Up to 2 stops" },
            ]}
            onChange={(v) => update("maxStops", parseInt(v, 10))}
          />
          <Select
            label="Travel style"
            value={prefs.travelType}
            options={[
              { value: "any", label: "Any" },
              { value: "leisure", label: "Leisure" },
              { value: "business", label: "Business" },
            ]}
            onChange={(v) => update("travelType", v)}
          />
          <Select
            label="Cabin class"
            value={prefs.cabin}
            options={[
              { value: "economy", label: "Economy" },
              { value: "premium_economy", label: "Premium economy" },
              { value: "business", label: "Business" },
              { value: "first", label: "First class" },
            ]}
            onChange={(v) => update("cabin", v)}
          />
          <Select
            label="Pricing style"
            value={prefs.flightStyle}
            options={[
              { value: "cheapest", label: "Cheapest first" },
              { value: "best_value", label: "Best value" },
              { value: "fastest", label: "Fastest" },
            ]}
            onChange={(v) => update("flightStyle", v)}
          />
        </div>
      </section>

      {/* Hotels */}
      <section className="flex flex-col gap-4 rounded-2xl border border-outline-variant p-6">
        <h2 className="text-base font-semibold text-on-surface">Hotels</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Select
            label="Hotel type"
            value={prefs.hotelType}
            options={[
              { value: "any", label: "Any" },
              { value: "hotel", label: "Hotel" },
              { value: "apartment", label: "Apartment" },
              { value: "hostel", label: "Hostel" },
            ]}
            onChange={(v) => update("hotelType", v)}
          />
          <Select
            label="Preferred location"
            value={prefs.hotelLocation}
            options={[
              { value: "any", label: "Any" },
              { value: "central", label: "City centre" },
              { value: "near_airport", label: "Near airport" },
              { value: "beach", label: "Near beach" },
            ]}
            onChange={(v) => update("hotelLocation", v)}
          />
        </div>
      </section>

      {/* Cars */}
      <section className="flex flex-col gap-4 rounded-2xl border border-outline-variant p-6">
        <h2 className="text-base font-semibold text-on-surface">Car rentals</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Select
            label="Car type"
            value={prefs.carType}
            options={[
              { value: "economy", label: "Economy" },
              { value: "compact", label: "Compact" },
              { value: "suv", label: "SUV" },
              { value: "van", label: "Van" },
              { value: "luxury", label: "Luxury" },
            ]}
            onChange={(v) => update("carType", v)}
          />
          <Select
            label="Insurance"
            value={prefs.carInsurance}
            options={[
              { value: "basic", label: "Basic" },
              { value: "full", label: "Full coverage" },
            ]}
            onChange={(v) => update("carInsurance", v)}
          />
          <Select
            label="Pickup type"
            value={prefs.carPickupType}
            options={[
              { value: "any", label: "Any" },
              { value: "airport", label: "Airport" },
              { value: "city", label: "City centre" },
            ]}
            onChange={(v) => update("carPickupType", v)}
          />
        </div>
      </section>

      {/* Excursions */}
      <section className="flex flex-col gap-4 rounded-2xl border border-outline-variant p-6">
        <h2 className="text-base font-semibold text-on-surface">Excursions</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Select
            label="Budget sensitivity"
            value={prefs.excursionBudget}
            options={[
              { value: "low", label: "Budget-friendly" },
              { value: "medium", label: "Mid-range" },
              { value: "high", label: "Premium experiences" },
            ]}
            onChange={(v) => update("excursionBudget", v)}
          />
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-medium text-on-surface-variant uppercase tracking-wide">
              Experience styles
            </p>
            <div className="flex flex-wrap gap-2">
              {(["culture", "food", "nature", "adventure"] as const).map((style) => {
                const active = prefs.excursionStyle.includes(style);
                return (
                  <button
                    key={style}
                    onClick={() => {
                      const next = active
                        ? prefs.excursionStyle.filter((s) => s !== style)
                        : [...prefs.excursionStyle, style];
                      update("excursionStyle", next);
                    }}
                    className={`rounded-full px-3 py-1 text-xs font-medium border capitalize transition-colors ${
                      active
                        ? "bg-primary text-white border-primary"
                        : "border-outline-variant text-on-surface hover:bg-surface-container"
                    }`}
                  >
                    {style}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
