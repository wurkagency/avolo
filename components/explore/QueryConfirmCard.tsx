"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useShallow } from "zustand/react/shallow";
import { useTripStore } from "@/lib/state/tripStore";
import { createSearch } from "@/lib/api/searchClient";
import type { ServiceType } from "@/types/trip";
import type { SearchRequest } from "@/types/search";

// ─── Constants ────────────────────────────────────────────────────────────────

const SERVICE_LABELS: Record<ServiceType, string> = {
  FLIGHT:    "Flight",
  HOTEL:     "Hotel",
  CAR:       "Car rental",
  EXCURSION: "Activities",
};

const SERVICE_ICONS: Record<ServiceType, string> = {
  FLIGHT:    "flight",
  HOTEL:     "hotel",
  CAR:       "directions_car",
  EXCURSION: "attractions",
};

const FLEX_LABELS: Record<string, string> = {
  PLUS_MINUS_1: "±1 day flexibility",
  PLUS_MINUS_3: "±3 days flexibility",
  PLUS_MINUS_7: "±7 days flexibility",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", {
    weekday: "short",
    day:     "numeric",
    month:   "long",
    year:    "numeric",
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface FieldRowProps {
  icon:    string;
  label:   string;
  value:   React.ReactNode;
  missing: boolean;
  required?: boolean;
}

function FieldRow({ icon, label, value, missing, required }: FieldRowProps) {
  return (
    <div
      style={{
        display:      "flex",
        alignItems:   "flex-start",
        gap:          12,
        padding:      "14px 0",
        borderBottom: "1px solid var(--color-hairline-soft)",
      }}
    >
      <span
        className="material-symbols-outlined"
        style={{
          fontSize:   18,
          color:      missing ? (required ? "var(--color-error, #c0392b)" : "var(--color-muted)") : "var(--color-primary)",
          flexShrink: 0,
          marginTop:  2,
        }}
        aria-hidden="true"
      >
        {icon}
      </span>
      <span
        style={{
          fontSize:   12,
          fontWeight: 600,
          color:      "var(--color-steel)",
          minWidth:   88,
          flexShrink: 0,
          fontFamily: "var(--font-inter)",
          paddingTop: 2,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        {label}
        {required && missing && (
          <span style={{ color: "var(--color-error, #c0392b)", marginLeft: 4 }}>*</span>
        )}
      </span>
      <span
        style={{
          fontSize:   14,
          lineHeight: 1.5,
          color:      missing ? (required ? "var(--color-error, #c0392b)" : "var(--color-muted)") : "var(--color-ink)",
          fontStyle:  missing ? "italic" : "normal",
          fontFamily: "var(--font-inter)",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function ServicePills({ services }: { services: ServiceType[] }) {
  if (services.length === 0) return <em style={{ color: "var(--color-muted)" }}>None selected</em>;
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
      {services.map((svc) => (
        <span
          key={svc}
          style={{
            display:         "inline-flex",
            alignItems:      "center",
            gap:             4,
            padding:         "3px 10px",
            borderRadius:    "var(--rounded-lg)",
            backgroundColor: "var(--color-cream)",
            border:          "1px solid var(--color-beige-deep)",
            fontSize:        12,
            fontWeight:      500,
            color:           "var(--color-primary-deep)",
            fontFamily:      "var(--font-inter)",
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 13 }} aria-hidden="true">
            {SERVICE_ICONS[svc]}
          </span>
          {SERVICE_LABELS[svc]}
        </span>
      ))}
    </span>
  );
}

// ─── QueryConfirmCard ─────────────────────────────────────────────────────────

export function QueryConfirmCard() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    departure,
    destination,
    services,
    departureDate,
    returnDate,
    isOneWay,
    flexibility,
    adults,
    children,
    hasDisability,
    handLuggage,
    checkedLuggage,
    specialLuggage,
    lastFilledFields,
  } = useTripStore(
    useShallow((s) => ({
      departure:        s.departure,
      destination:      s.destination,
      services:         s.services,
      departureDate:    s.departureDate,
      returnDate:       s.returnDate,
      isOneWay:         s.isOneWay,
      flexibility:      s.flexibility,
      adults:           s.adults,
      children:         s.children,
      hasDisability:    s.hasDisability,
      handLuggage:      s.handLuggage,
      checkedLuggage:   s.checkedLuggage,
      specialLuggage:   s.specialLuggage,
      lastFilledFields: s.lastFilledFields,
    })),
  );

  // ── Validation ─────────────────────────────────────────────────────────────
  const hasFlight = services.includes("FLIGHT");
  const missingDep  = !departure;
  const missingDest = !destination;
  const missingDate = !departureDate;

  // All three are required by SearchRequest regardless of services
  const canSearch = !missingDep && !missingDest && !missingDate;

  // ── Search submission ───────────────────────────────────────────────────────
  async function handleSearch() {
    if (!canSearch || submitting || !departure || !destination || !departureDate) return;

    const dep  = departure;
    const dest = destination;

    const req: SearchRequest = {
      departure:     dep.iata,
      departureName: dep.name,
      destination:   dest.iata,
      destinationName: dest.name,
      ...(dep.nearbyIatas?.length  ? { departureAirports:   [dep.iata,  ...dep.nearbyIatas]  } : {}),
      ...(dest.nearbyIatas?.length ? { destinationAirports: [dest.iata, ...dest.nearbyIatas] } : {}),
      services,
      departureDate:  departureDate,
      returnDate:     isOneWay ? null : (returnDate ?? null),
      isOneWay,
      flexibility,
      adults,
      children,
      hasDisability,
      handLuggage,
      checkedLuggage,
      specialLuggage,
    };

    setSubmitting(true);
    setSubmitError(null);

    try {
      const { tripId } = await createSearch(req);
      router.push(`/results?tripId=${encodeURIComponent(tripId)}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Search failed — please try again");
      setSubmitting(false);
    }
  }

  function handleEditManually() {
    router.push("/explore/flights");
  }

  // ── Field display values ────────────────────────────────────────────────────

  // Route
  const depLabel  = departure  ? `${departure.name} (${departure.iata})`   : null;
  const destLabel = destination ? `${destination.name} (${destination.iata})` : null;

  let routeValue: React.ReactNode;
  let routeMissing = false;

  if (depLabel && destLabel) {
    routeValue = (
      <span style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        <strong style={{ fontWeight: 600 }}>{depLabel}</strong>
        <span className="material-symbols-outlined" style={{ fontSize: 14, color: "var(--color-steel)" }}>arrow_forward</span>
        <strong style={{ fontWeight: 600 }}>{destLabel}</strong>
      </span>
    );
  } else if (depLabel) {
    routeValue = (
      <span style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        <strong style={{ fontWeight: 600 }}>{depLabel}</strong>
        <span className="material-symbols-outlined" style={{ fontSize: 14, color: "var(--color-steel)" }}>arrow_forward</span>
        <em>destination not set</em>
      </span>
    );
    routeMissing = true;
  } else if (destLabel) {
    routeValue = (
      <span style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        <em>departure not set</em>
        <span className="material-symbols-outlined" style={{ fontSize: 14, color: "var(--color-steel)" }}>arrow_forward</span>
        <strong style={{ fontWeight: 600 }}>{destLabel}</strong>
      </span>
    );
    routeMissing = true;
  } else {
    routeValue = "Departure and destination not set";
    routeMissing = true;
  }

  // Dates
  let datesValue: React.ReactNode;
  let datesMissing = false;

  if (departureDate) {
    const depStr = fmtDate(departureDate);
    let base: React.ReactNode;

    if (isOneWay) {
      base = <>{depStr} <span style={{ fontSize: 12, color: "var(--color-steel)" }}>(one way)</span></>;
    } else if (returnDate) {
      base = `${depStr} – ${fmtDate(returnDate)}`;
    } else {
      base = <>{depStr} – <em>return date not set</em></>;
      datesMissing = true;
    }

    if (flexibility && flexibility !== "EXACT") {
      datesValue = (
        <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span>{base}</span>
          <span style={{ fontSize: 12, color: "var(--color-steel)" }}>{FLEX_LABELS[flexibility]}</span>
        </span>
      );
    } else {
      datesValue = base;
    }
  } else {
    datesValue = "Departure date not set";
    datesMissing = true;
  }

  // Travelers
  const adultStr = `${adults} adult${adults !== 1 ? "s" : ""}`;
  const kidStr   = children.length > 0
    ? `, ${children.length} child${children.length !== 1 ? "ren" : ""} (ages: ${children.join(", ")})`
    : "";
  const disabilityStr = hasDisability ? " · accessibility assistance" : "";
  const travelersValue = `${adultStr}${kidStr}${disabilityStr}`;

  // Luggage
  const luggageParts: string[] = [];
  if (handLuggage > 0) luggageParts.push(`${handLuggage} cabin bag${handLuggage !== 1 ? "s" : ""}`);
  if (checkedLuggage > 0) luggageParts.push(`${checkedLuggage} checked bag${checkedLuggage !== 1 ? "s" : ""}`);
  if (specialLuggage) luggageParts.push("special items");
  const luggageValue = luggageParts.length > 0 ? luggageParts.join(", ") : "No checked luggage";

  // Missing required fields summary
  const missingFields: string[] = [];
  if (missingDep)  missingFields.push("departure airport");
  if (missingDest) missingFields.push("destination airport");
  if (missingDate) missingFields.push("departure date");

  return (
    <div
      style={{
        width:         "100%",
        maxWidth:      840,
        margin:        "0 auto",
        display:       "flex",
        flexDirection: "column",
        gap:           "var(--spacing-xl)",
        animation:     "stepSlideIn 0.25s ease forwards",
      }}
    >
      {/* Heading */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <h1
          style={{
            fontFamily:    "var(--font-editorial), 'Playfair Display', serif",
            fontSize:      "clamp(28px, 5vw, 40px)",
            fontWeight:    400,
            lineHeight:    1.1,
            letterSpacing: "-0.02em",
            color:         "var(--color-ink)",
            margin:        0,
          }}
        >
          Here's what I understood
        </h1>
        <p
          style={{
            fontFamily: "var(--font-inter)",
            fontSize:   15,
            lineHeight: 1.5,
            color:      "var(--color-steel)",
            margin:     0,
          }}
        >
          {lastFilledFields.length > 0
            ? "Review every detail before we search. Flights require all route and date fields."
            : "I couldn't read your query clearly — please review and fill in the fields below."}
        </p>
      </div>

      {/* Summary card */}
      <div
        style={{
          border:          "1px solid var(--color-hairline-soft)",
          borderRadius:    "var(--rounded-lg)",
          backgroundColor: "var(--color-canvas)",
          padding:         "0 var(--spacing-lg)",
        }}
      >
        <FieldRow
          icon="flight"
          label="Route"
          value={routeValue}
          missing={routeMissing}
          required={routeMissing}
        />
        <FieldRow
          icon="category"
          label="Services"
          value={<ServicePills services={services} />}
          missing={services.length === 0}
        />
        <FieldRow
          icon="calendar_month"
          label="Dates"
          value={datesValue}
          missing={missingDate}
          required={missingDate}
        />
        <FieldRow
          icon="person"
          label="Travelers"
          value={travelersValue}
          missing={false}
        />
        <FieldRow
          icon="luggage"
          label="Luggage"
          value={luggageValue}
          missing={false}
        />
      </div>

      {/* Missing-fields warning */}
      {missingFields.length > 0 && (
        <div
          style={{
            display:         "flex",
            alignItems:      "flex-start",
            gap:             10,
            padding:         "12px 16px",
            borderRadius:    "var(--rounded-md)",
            backgroundColor: "var(--color-error-surface, #fdf2f0)",
            border:          "1px solid var(--color-error-border, #f5c6bd)",
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 18, color: "var(--color-error, #c0392b)", flexShrink: 0, marginTop: 1 }}
            aria-hidden="true"
          >
            warning
          </span>
          <p
            style={{
              margin:     0,
              fontFamily: "var(--font-inter)",
              fontSize:   13,
              lineHeight: 1.5,
              color:      "var(--color-error, #c0392b)",
            }}
          >
            <strong>Cannot search yet.</strong> Missing required fields:{" "}
            {missingFields.join(", ")}. Use <em>Fill in manually</em> below to complete them.
          </p>
        </div>
      )}

      {/* Submit error */}
      {submitError && (
        <div
          style={{
            display:         "flex",
            alignItems:      "flex-start",
            gap:             10,
            padding:         "12px 16px",
            borderRadius:    "var(--rounded-md)",
            backgroundColor: "var(--color-error-surface, #fdf2f0)",
            border:          "1px solid var(--color-error-border, #f5c6bd)",
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 18, color: "var(--color-error, #c0392b)", flexShrink: 0, marginTop: 1 }}
            aria-hidden="true"
          >
            error
          </span>
          <p style={{ margin: 0, fontFamily: "var(--font-inter)", fontSize: 13, color: "var(--color-error, #c0392b)" }}>
            {submitError}
          </p>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {/* Primary: Search */}
        <button
          type="button"
          onClick={handleSearch}
          disabled={!canSearch || submitting}
          style={{
            width:           "100%",
            padding:         "16px",
            borderRadius:    "var(--rounded-md)",
            border:          "none",
            backgroundColor: canSearch ? "var(--color-primary)" : "var(--color-muted, #ccc)",
            color:           "var(--color-on-primary, #fff)",
            fontFamily:      "var(--font-inter)",
            fontSize:        16,
            fontWeight:      700,
            cursor:          canSearch && !submitting ? "pointer" : "not-allowed",
            opacity:         submitting ? 0.7 : 1,
            display:         "flex",
            alignItems:      "center",
            justifyContent:  "center",
            gap:             8,
            transition:      "background-color 0.15s",
          }}
        >
          {submitting ? (
            <>
              <span
                style={{
                  display:      "inline-block",
                  width:        16,
                  height:       16,
                  border:       "2px solid rgba(255,255,255,0.3)",
                  borderTop:    "2px solid #fff",
                  borderRadius: "50%",
                  animation:    "spin 0.7s linear infinite",
                }}
              />
              Searching…
            </>
          ) : (
            <>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden="true">search</span>
              Search trips
            </>
          )}
        </button>

        {/* Secondary row: Edit query + Fill manually */}
        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined") {
                sessionStorage.setItem("avolo_edit_mode", "1");
              }
              router.push("/explore");
            }}
            style={{
              flex:            1,
              padding:         "13px 16px",
              borderRadius:    "var(--rounded-md)",
              border:          "1px solid var(--color-hairline-strong)",
              backgroundColor: "var(--color-canvas)",
              color:           "var(--color-ink)",
              fontFamily:      "var(--font-inter)",
              fontSize:        14,
              fontWeight:      600,
              cursor:          "pointer",
            }}
          >
            Edit query
          </button>
          <button
            type="button"
            onClick={handleEditManually}
            style={{
              flex:            1,
              padding:         "13px 16px",
              borderRadius:    "var(--rounded-md)",
              border:          "1px solid var(--color-hairline-strong)",
              backgroundColor: "var(--color-canvas)",
              color:           "var(--color-ink)",
              fontFamily:      "var(--font-inter)",
              fontSize:        14,
              fontWeight:      600,
              cursor:          "pointer",
            }}
          >
            Fill in manually
          </button>
        </div>
      </div>

      <style>{`
        @keyframes stepSlideIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
