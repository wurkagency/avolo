"use client";

import { useRouter } from "next/navigation";
import { useShallow } from "zustand/react/shallow";
import { useTripStore } from "@/lib/state/tripStore";
import { nextMissingStep } from "@/lib/utils/wizardRouting";
import type { ServiceType } from "@/types/trip";

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
  PLUS_MINUS_1: "±1 day",
  PLUS_MINUS_3: "±3 days",
  PLUS_MINUS_7: "±7 days",
};

function fmtDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", {
    weekday: "short",
    day:     "numeric",
    month:   "short",
    year:    "numeric",
  });
}

// ─── FieldRow ─────────────────────────────────────────────────────────────────

interface FieldRowProps {
  icon:    string;
  label:   string;
  value:   React.ReactNode;
  missing: boolean;
}

function FieldRow({ icon, label, value, missing }: FieldRowProps) {
  return (
    <div
      style={{
        display:      "flex",
        alignItems:   "flex-start",
        gap:          "var(--spacing-sm)",
        padding:      "var(--spacing-sm) 0",
        borderBottom: "1px solid var(--color-hairline-soft)",
      }}
    >
      <span
        className="material-symbols-outlined"
        style={{
          fontSize:   18,
          color:      missing ? "var(--color-muted)" : "var(--color-primary)",
          flexShrink: 0,
          marginTop:  2,
        }}
        aria-hidden="true"
      >
        {icon}
      </span>
      <span
        style={{
          fontSize:   13,
          fontWeight: 500,
          color:      "var(--color-steel)",
          minWidth:   84,
          flexShrink: 0,
          fontFamily: "var(--font-inter)",
          paddingTop: 1,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize:   14,
          lineHeight: 1.5,
          color:      missing ? "var(--color-muted)" : "var(--color-ink)",
          fontStyle:  missing ? "italic" : "normal",
          fontFamily: "var(--font-inter)",
        }}
      >
        {value}
      </span>
    </div>
  );
}

// ─── ServicePills ─────────────────────────────────────────────────────────────

function ServicePills({ services }: { services: ServiceType[] }) {
  if (services.length === 0) return <em style={{ color: "var(--color-muted)" }}>None selected</em>;
  return (
    <span style={{ display: "flex", alignItems: "center", gap: "var(--spacing-xs)", flexWrap: "wrap" }}>
      {services.map((svc) => (
        <span
          key={svc}
          style={{
            display:         "inline-flex",
            alignItems:      "center",
            gap:             4,
            padding:         "2px 10px",
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
      lastFilledFields: s.lastFilledFields,
    })),
  );

  function handleContinue() {
    const store  = useTripStore.getState();
    const filled = new Set(store.lastFilledFields);
    router.push(nextMissingStep(store, filled));
  }

  // ── Route value ────────────────────────────────────────────────────────────
  let routeValue: React.ReactNode;
  let routeMissing = false;

  if (departure && destination) {
    routeValue = `${departure.name} → ${destination.name}`;
  } else if (departure) {
    routeValue = <>{departure.name} → <em style={{ color: "var(--color-muted)" }}>destination missing</em></>;
    routeMissing = true;
  } else if (destination) {
    routeValue = <><em style={{ color: "var(--color-muted)" }}>departure missing</em> → {destination.name}</>;
    routeMissing = true;
  } else {
    routeValue = "Departure & destination not set";
    routeMissing = true;
  }

  // ── Dates value ────────────────────────────────────────────────────────────
  let datesValue: React.ReactNode;
  let datesMissing = false;

  if (departureDate) {
    const depLabel = fmtDate(departureDate);
    let base: React.ReactNode;

    if (isOneWay) {
      base = `${depLabel} (one way)`;
    } else if (returnDate) {
      base = `${depLabel} – ${fmtDate(returnDate)}`;
    } else {
      base = <>{depLabel} – <em style={{ color: "var(--color-muted)" }}>return date missing</em></>;
      datesMissing = true;
    }

    if (flexibility && flexibility !== "EXACT") {
      datesValue = (
        <>
          {base}{" "}
          <span style={{ fontSize: 12, color: "var(--color-steel)" }}>({FLEX_LABELS[flexibility]})</span>
        </>
      );
    } else {
      datesValue = base;
    }
  } else {
    datesValue = "Not set — you'll pick these next";
    datesMissing = true;
  }

  // ── Travelers value ────────────────────────────────────────────────────────
  let travelersValue = `${adults} adult${adults !== 1 ? "s" : ""}`;
  if (children.length > 0) {
    const ages = children.map((age) => `age ${age}`).join(", ");
    travelersValue += `, ${children.length} child${children.length !== 1 ? "ren" : ""} (${ages})`;
  }

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
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-xs)" }}>
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
            ? "Review the details below. Missing fields will be filled in the next steps."
            : "I couldn't parse any travel details — please fill them in below."}
        </p>
      </div>

      {/* Summary card */}
      <div
        style={{
          border:          "1px solid var(--color-hairline-soft)",
          borderRadius:    "var(--rounded-lg)",
          backgroundColor: "var(--color-canvas)",
          padding:         "var(--spacing-xs) var(--spacing-lg)",
        }}
      >
        <FieldRow icon="flight"         label="Route"     value={routeValue}                      missing={routeMissing} />
        <FieldRow icon="category"       label="Services"  value={<ServicePills services={services} />} missing={services.length === 0} />
        <FieldRow icon="calendar_month" label="Dates"     value={datesValue}                      missing={datesMissing} />
        <FieldRow icon="person"         label="Travelers" value={travelersValue}                  missing={false} />
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: "var(--spacing-md)" }}>
        <button
          type="button"
          onClick={() => router.push("/explore")}
          style={{
            flex:            1,
            padding:         "16px",
            borderRadius:    "var(--rounded-md)",
            border:          "1px solid var(--color-hairline-strong)",
            backgroundColor: "var(--color-canvas)",
            color:           "var(--color-ink)",
            fontFamily:      "var(--font-inter)",
            fontSize:        16,
            fontWeight:      600,
            cursor:          "pointer",
          }}
        >
          Edit query
        </button>
        <button
          type="button"
          onClick={handleContinue}
          style={{
            flex:            2,
            padding:         "16px",
            borderRadius:    "var(--rounded-md)",
            border:          "none",
            backgroundColor: "var(--color-primary)",
            color:           "var(--color-on-primary)",
            fontFamily:      "var(--font-inter)",
            fontSize:        16,
            fontWeight:      700,
            cursor:          "pointer",
          }}
        >
          Continue
        </button>
      </div>

      <style>{`
        @keyframes stepSlideIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
