// TravelPayouts CarRentals API.
// Uses their car rental affiliate API to fetch available vehicles.

import type { SearchRequest } from "@/types/search";

const BASE = "https://api.travelpayouts.com/car-rental/v1";

export interface TravelPayoutsCarRaw {
  id: string;
  make: string;
  model: string;
  category: string;      // economy | compact | suv | van | luxury
  seats: number;
  doors: number;
  transmission: string;  // automatic | manual
  ac: boolean;
  supplier: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupDate: string;    // ISO
  dropoffDate: string;   // ISO
  days: number;
  totalPriceEur: number;
  insurance: string;     // basic | full | credit-card
  deepLink: string;
  imageUrl: string | null;
}

interface CarRentalResponse {
  success: boolean;
  data: TravelPayoutsCarRaw[];
}

function daysBetween(from: string, to: string): number {
  return Math.max(1, Math.round(
    (new Date(to).getTime() - new Date(from).getTime()) / 86_400_000,
  ));
}

export async function fetchTravelPayoutsCars(
  req: SearchRequest,
): Promise<TravelPayoutsCarRaw[]> {
  const apiKey = process.env.TRAVELPAYOUTS_API_KEY;
  if (!apiKey) {
    console.warn("[TP cars] TRAVELPAYOUTS_API_KEY not configured — skipping");
    return [];
  }

  const pickupDate = req.departureDate;
  const dropoffDate = req.returnDate ?? req.departureDate;
  const numDays = daysBetween(pickupDate, dropoffDate);
  if (numDays < 1) return [];

  const params = new URLSearchParams({
    pickup_iata: req.destination,
    dropoff_iata: req.destination,
    pickup_date: pickupDate,
    dropoff_date: dropoffDate,
    currency: "EUR",
    limit: "20",
    token: apiKey,
  });

  const res = await fetch(`${BASE}/search?${params.toString()}`, {
    headers: { "X-Access-Token": apiKey },
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    throw new Error(`TravelPayouts cars API error: ${res.status}`);
  }

  const body = await res.json() as CarRentalResponse;

  if (!body.success || !Array.isArray(body.data)) {
    throw new Error("TravelPayouts cars returned unexpected shape");
  }

  return body.data.map((item) => {
    // TravelPayouts car API returns vehicle_image or picture_url depending on partner
    const raw = item as unknown as Record<string, unknown>;
    const imageUrl =
      (raw.vehicle_image as string | null) ??
      (raw.picture_url as string | null) ??
      (raw.image_url as string | null) ??
      null;
    return { ...item, days: numDays, pickupDate, dropoffDate, imageUrl };
  });
}
