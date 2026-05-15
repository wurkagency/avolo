// Normalizes raw provider responses into NormalizedResult.
// All prices are converted to EUR (TravelPayouts always requests EUR; Duffel may return GBP).

import { randomUUID } from "crypto";
import type { NormalizedResult } from "@/types/search";
import type { TravelPayoutsFlightRaw } from "./travelPayoutsProvider";
import type { DuffelOfferRaw } from "./duffelProvider";
import { parseDuration } from "./duffelProvider";

// Static GBP→EUR fallback rate (real conversion via currencyapi.com in Phase 7)
const GBP_TO_EUR = 1.17;

function currencyToEur(amount: number, currency: string): number {
  const upper = currency.toUpperCase();
  if (upper === "EUR") return amount;
  if (upper === "GBP") return amount * GBP_TO_EUR;
  // Throw on unknown currency — silently storing non-EUR would violate the
  // architectural invariant "all prices stored as EUR".
  throw new Error(`[flightNormalizer] Cannot convert ${currency} to EUR — add rate to currencyToEur`);
}

// ─── TravelPayouts → NormalizedResult ─────────────────────────────────────

export function normalizeTravelPayoutsFlights(
  raw: TravelPayoutsFlightRaw[],
  departure: string,
  destination: string,
): NormalizedResult[] {
  return raw.map((item) => {
    const isRefundable = false; // TP cache fares are typically non-refundable
    const stops = item.transfers;
    const returnStops = item.return_transfers ?? null;

    const riskReasons: string[] = [];
    if (stops > 1) riskReasons.push("Multiple stops");
    if (!isRefundable) riskReasons.push("Non-refundable fare");

    return {
      id: `tp-${item.airline}-${item.flight_number}-${item.departure_at}`,
      serviceType: "FLIGHT",
      provider: "travelpayouts",
      priceEur: currencyToEur(item.price, "eur"),
      riskLevel: stops > 1 ? "MEDIUM" : "LOW",
      riskReasons,
      isRefundable,
      deepLinkUrl: item.link,
      rank: 0,
      aiSlot: null,
      aiSummary: null,
      flight: {
        airline: item.airline,
        airlineCode: item.airline,
        stops,
        durationMinutes: item.duration,
        departureTime: item.departure_at,
        arrivalTime: "", // TP doesn't provide arrival time in this endpoint
        departureAirport: departure,
        arrivalAirport: destination,
        cabin: "economy",
        baggage: "cabin bag included",
        returnFlight:
          item.return_at && returnStops !== null
            ? {
                departureTime: item.return_at,
                arrivalTime: "",
                durationMinutes: item.return_duration ?? 0,
                stops: returnStops,
              }
            : null,
      },
      hotel: null,
      car: null,
      excursion: null,
    } satisfies NormalizedResult;
  });
}

// ─── Duffel → NormalizedResult ─────────────────────────────────────────────

export function normalizeDuffelFlights(raw: DuffelOfferRaw[]): NormalizedResult[] {
  return raw.flatMap((offer) => {
    const outboundSlice = offer.slices[0];
    const returnSlice = offer.slices[1] ?? null;

    if (!outboundSlice) {
      console.warn(`[duffelNormalizer] Offer ${offer.id} has no slices — skipping`);
      return [];
    }

    const firstSeg = outboundSlice.segments[0];
    if (!firstSeg) {
      console.warn(`[duffelNormalizer] Offer ${offer.id} outbound has no segments — skipping`);
      return [];
    }

    const stops = Math.max(0, outboundSlice.segments.length - 1);
    const durationMinutes = parseDuration(outboundSlice.duration);
    const priceEur = currencyToEur(parseFloat(offer.total_amount), offer.total_currency);
    const isRefundable = offer.conditions.refund_before_departure?.allowed ?? false;

    const riskReasons: string[] = [];
    if (stops > 1) riskReasons.push("Multiple stops");
    if (!isRefundable) riskReasons.push("Non-refundable fare");

    const deepLink = `https://www.duffel.com/offers/${offer.id}`;

    const normalized: NormalizedResult = {
      id: offer.id,
      serviceType: "FLIGHT",
      provider: "duffel",
      priceEur,
      riskLevel: stops > 1 ? "MEDIUM" : "LOW",
      riskReasons,
      isRefundable,
      deepLinkUrl: deepLink,
      rank: 0,
      aiSlot: null,
      aiSummary: null,
      flight: {
        airline: firstSeg.marketing_carrier.name,
        airlineCode: firstSeg.marketing_carrier.iata_code,
        stops,
        durationMinutes,
        departureTime: firstSeg.departing_at,
        arrivalTime: outboundSlice.segments.at(-1)?.arriving_at ?? "",
        departureAirport: outboundSlice.origin.iata_code,
        arrivalAirport: outboundSlice.destination.iata_code,
        cabin: "economy",
        baggage: "cabin bag included",
        returnFlight: returnSlice
          ? {
              departureTime: returnSlice.segments[0]?.departing_at ?? "",
              arrivalTime: returnSlice.segments.at(-1)?.arriving_at ?? "",
              durationMinutes: parseDuration(returnSlice.duration),
              stops: Math.max(0, returnSlice.segments.length - 1),
            }
          : null,
      },
      hotel: null,
      car: null,
      excursion: null,
    };
    return [normalized];
  });
}

// ─── De-duplicate results across providers ─────────────────────────────────
// Key: same airline + same departure time + same arrival airport

export function deduplicateFlights(results: NormalizedResult[]): NormalizedResult[] {
  const seen = new Set<string>();
  return results.filter((r) => {
    if (!r.flight) return true;
    const key = `${r.flight.airlineCode}-${r.flight.departureTime}-${r.flight.arrivalAirport}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ─── Generate placeholder when all providers fail ──────────────────────────
// Returns a single "no results" entry rather than an empty array,
// so the UI can display a meaningful empty state.

export function emptyFlightResult(id = randomUUID()): NormalizedResult {
  return {
    id,
    serviceType: "FLIGHT",
    provider: "none",
    priceEur: 0,
    riskLevel: "LOW",
    riskReasons: [],
    isRefundable: false,
    deepLinkUrl: "",
    rank: 0,
    aiSlot: null,
    aiSummary: null,
    flight: null,
    hotel: null,
    car: null,
    excursion: null,
  };
}
