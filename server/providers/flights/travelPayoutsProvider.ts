// TravelPayouts Aviasales v3 flight prices API.
// Returns cached fare data — not real-time bookable, but good for price discovery.

import type { SearchRequest } from "@/types/search";

export interface TravelPayoutsFlightRaw {
  origin: string;
  destination: string;
  origin_airport: string;
  destination_airport: string;
  price: number;          // in requested currency (EUR)
  airline: string;        // IATA carrier code
  flight_number: string;
  departure_at: string;   // ISO datetime
  return_at: string | null;
  transfers: number;
  return_transfers: number | null;
  duration: number;       // minutes (outbound)
  return_duration: number | null;
  link: string;           // relative deep-link path
  currency: string;
}

interface TravelPayoutsResponse {
  success: boolean;
  data: TravelPayoutsFlightRaw[];
  currency: string;
}

const BASE = "https://api.travelpayouts.com/aviasales/v3/prices_for_dates";
const DEEP_LINK_BASE = "https://www.aviasales.com";

async function fetchOnePair(
  origin: string,
  destination: string,
  req: SearchRequest,
  apiKey: string,
): Promise<TravelPayoutsFlightRaw[]> {
  const params = new URLSearchParams({
    origin,
    destination,
    departure_at: req.departureDate.slice(0, 7),
    currency: "eur",
    direct: "false",
    limit: "30",
    sorting: "price",
    unique: "false",
    one_way: req.isOneWay ? "true" : "false",
    ...(req.returnDate ? { return_at: req.returnDate.slice(0, 7) } : {}),
    token: apiKey,
  });

  const res = await fetch(`${BASE}?${params.toString()}`, {
    headers: { "X-Access-Token": apiKey },
    signal: AbortSignal.timeout(15_000),
    next: { revalidate: 0 },
  });

  if (!res.ok) throw new Error(`TravelPayouts flights API error: ${res.status}`);

  const body = await res.json() as TravelPayoutsResponse;
  if (!body.success || !Array.isArray(body.data)) throw new Error("Unexpected shape");

  return body.data.map((item) => ({
    ...item,
    link: item.link.startsWith("http") ? item.link : `${DEEP_LINK_BASE}${item.link}`,
  }));
}

export async function fetchTravelPayoutsFlights(
  req: SearchRequest,
): Promise<TravelPayoutsFlightRaw[]> {
  const apiKey = process.env.TRAVELPAYOUTS_API_KEY;
  if (!apiKey) {
    console.warn("[TP flights] TRAVELPAYOUTS_API_KEY not configured — skipping");
    return [];
  }

  const departures = req.departureAirports?.length ? req.departureAirports : [req.departure];
  const destinations = req.destinationAirports?.length ? req.destinationAirports : [req.destination];

  // Cap at 4 departure × 3 destination to avoid excessive API calls
  const cappedDep = departures.slice(0, 4);
  const cappedDest = destinations.slice(0, 3);

  const pairs: Array<[string, string]> = [];
  for (const dep of cappedDep) {
    for (const dest of cappedDest) {
      pairs.push([dep, dest]);
    }
  }

  const settled = await Promise.allSettled(
    pairs.map(([dep, dest]) => fetchOnePair(dep, dest, req, apiKey)),
  );

  const results: TravelPayoutsFlightRaw[] = [];
  for (const s of settled) {
    if (s.status === "fulfilled") results.push(...s.value);
    else console.warn("[TP flights] pair failed:", s.reason);
  }

  if (results.length === 0 && settled.every((s) => s.status === "rejected")) {
    throw new Error("TravelPayouts flights API error: all pairs failed");
  }

  return results;
}
