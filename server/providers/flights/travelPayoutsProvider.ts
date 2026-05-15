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

export async function fetchTravelPayoutsFlights(
  req: SearchRequest,
): Promise<TravelPayoutsFlightRaw[]> {
  const apiKey = process.env.TRAVELPAYOUTS_API_KEY;
  if (!apiKey) {
    console.warn("[TP flights] TRAVELPAYOUTS_API_KEY not configured — skipping");
    return [];
  }

  const params = new URLSearchParams({
    origin: req.departure,
    destination: req.destination,
    departure_at: req.departureDate.slice(0, 7), // YYYY-MM
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
    next: { revalidate: 0 }, // no Next.js caching for search results
  });

  if (!res.ok) {
    throw new Error(`TravelPayouts flights API error: ${res.status}`);
  }

  const body = await res.json() as TravelPayoutsResponse;

  if (!body.success || !Array.isArray(body.data)) {
    throw new Error("TravelPayouts flights returned unexpected shape");
  }

  return body.data.map((item) => ({
    ...item,
    link: item.link.startsWith("http") ? item.link : `${DEEP_LINK_BASE}${item.link}`,
  }));
}
