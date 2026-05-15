// Duffel Air Search API v1.
// Two-step: create offer_request → fetch offers.
// Fallback for when TravelPayouts returns no results.

import type { SearchRequest } from "@/types/search";

const BASE = "https://api.duffel.com";

// ─── Raw Duffel shapes ─────────────────────────────────────────────────────

interface DuffelPassenger {
  type: "adult" | "child";
  age?: number;
}

interface DuffelSlice {
  origin: { iata_code: string };
  destination: { iata_code: string };
  duration: string | null;  // ISO 8601 e.g. "PT2H30M"
  segments: DuffelSegment[];
}

interface DuffelSegment {
  marketing_carrier: { iata_code: string; name: string };
  marketing_carrier_flight_number: string;
  departing_at: string;  // ISO datetime
  arriving_at: string;   // ISO datetime
}

export interface DuffelOfferRaw {
  id: string;
  total_amount: string;   // decimal string e.g. "89.50"
  total_currency: string; // ISO 4217 e.g. "EUR"
  slices: DuffelSlice[];
  conditions: {
    refund_before_departure: { allowed: boolean } | null;
  };
  owner: { name: string; iata_code: string };
}

interface DuffelOfferRequestResponse {
  data: { id: string };
}

interface DuffelOffersResponse {
  data: DuffelOfferRaw[];
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function duffelHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "Duffel-Version": "v1",
  };
}

// Parse ISO 8601 duration "PT2H30M" → minutes
function parseDuration(iso: string | null): number {
  if (!iso) return 0;
  const h = iso.match(/(\d+)H/)?.[1] ?? "0";
  const m = iso.match(/(\d+)M/)?.[1] ?? "0";
  return parseInt(h) * 60 + parseInt(m);
}

export { parseDuration };

// ─── Main fetch function ───────────────────────────────────────────────────

export async function fetchDuffelFlights(req: SearchRequest): Promise<DuffelOfferRaw[]> {
  const token = process.env.DUFFEL_ACCESS_TOKEN;
  if (!token) {
    console.warn("[Duffel] DUFFEL_ACCESS_TOKEN not configured — skipping");
    return [];
  }

  const passengers: DuffelPassenger[] = [
    ...Array.from({ length: req.adults }, () => ({ type: "adult" as const })),
    ...req.children.map((age) => ({ type: "child" as const, age })),
  ];

  const slices = req.isOneWay
    ? [{ origin: req.departure, destination: req.destination, departure_date: req.departureDate }]
    : [
        { origin: req.departure, destination: req.destination, departure_date: req.departureDate },
        ...(req.returnDate
          ? [{ origin: req.destination, destination: req.departure, departure_date: req.returnDate }]
          : []),
      ];

  // Step 1: create offer request
  const offerRequestRes = await fetch(`${BASE}/air/offer_requests`, {
    method: "POST",
    headers: duffelHeaders(token),
    body: JSON.stringify({
      data: {
        slices,
        passengers,
        cabin_class: "economy",
        max_connections: req.hasDisability ? 0 : 2,
      },
    }),
    signal: AbortSignal.timeout(20_000),
  });

  if (!offerRequestRes.ok) {
    throw new Error(`Duffel offer request failed: ${offerRequestRes.status}`);
  }

  const offerRequestBody = await offerRequestRes.json() as DuffelOfferRequestResponse;
  const offerRequestId = offerRequestBody.data?.id;
  if (!offerRequestId) throw new Error("Duffel: no offer_request id in response");

  // Step 2: fetch offers
  const offersRes = await fetch(
    `${BASE}/air/offers?offer_request_id=${offerRequestId}&limit=30&sort=total_amount`,
    {
      headers: duffelHeaders(token),
      signal: AbortSignal.timeout(20_000),
    },
  );

  if (!offersRes.ok) {
    throw new Error(`Duffel offers fetch failed: ${offersRes.status}`);
  }

  const offersBody = await offersRes.json() as DuffelOffersResponse;
  return offersBody.data ?? [];
}
