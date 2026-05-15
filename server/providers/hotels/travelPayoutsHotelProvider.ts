// TravelPayouts Hotellook Hotel Search API.
// Two-step: start search → poll for results.

import type { SearchRequest } from "@/types/search";

const BASE = "https://engine.hotellook.com/api/v2";

// ─── Raw Hotellook shapes ──────────────────────────────────────────────────

export interface HotellookHotelRaw {
  hotelId: number;
  hotelName: string;
  stars: number;
  guestScore: number | null;   // 0–100
  reviewsCount: number | null;
  address: string | null;
  distanceToCentre: number | null; // km
  photoUrl: string | null;
  minPrice: number;            // per night in EUR
  nights: number;
  checkIn: string;   // ISO date
  checkOut: string;  // ISO date
  rooms: Array<{
    type: string;
    price: number;       // total EUR
    cancellation: string; // "free" | "non-refundable" | ...
    breakfast: boolean;
    deepLink: string;
  }>;
}

interface HotellookSearchStart {
  searchId: string;
}

interface HotellookSearchResults {
  status: "pending" | "complete" | "error";
  result: HotellookHotelRaw[] | null;
}

function nights(checkIn: string, checkOut: string): number {
  return Math.max(1, Math.round(
    (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86_400_000,
  ));
}

export async function fetchTravelPayoutsHotels(
  req: SearchRequest,
): Promise<HotellookHotelRaw[]> {
  const apiKey = process.env.TRAVELPAYOUTS_API_KEY;
  if (!apiKey) {
    console.warn("[TP hotels] TRAVELPAYOUTS_API_KEY not configured — skipping");
    return [];
  }

  if (!req.returnDate && !req.isOneWay) {
    console.warn("[TP hotels] No returnDate for hotel search — skipping");
    return [];
  }

  const checkIn = req.departureDate;
  const checkOut = req.returnDate ?? req.departureDate;
  if (checkIn === checkOut) {
    console.warn("[TP hotels] checkIn === checkOut — skipping hotel search");
    return [];
  }
  const stayNights = nights(checkIn, checkOut);
  if (stayNights < 1) return [];

  const adultsCount = req.adults;
  const childrenCount = req.children.length;
  const childrenAges = req.children;

  // Step 1: start search
  const startRes = await fetch(`${BASE}/search/start.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Access-Token": apiKey,
    },
    body: JSON.stringify({
      query: {
        destination: req.destination, // IATA or city name
        checkIn,
        checkOut,
        adultsCount,
        childrenCount,
        childrenAges,
        currency: "EUR",
        language: "en",
        waitForResults: false,
      },
    }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!startRes.ok) throw new Error(`Hotellook start failed: ${startRes.status}`);

  const startBody = await startRes.json() as HotellookSearchStart;
  const searchId = startBody.searchId;
  if (!searchId) throw new Error("Hotellook: no searchId in start response");

  // Step 2: poll for results (max 4 attempts, 2s apart)
  for (let attempt = 0; attempt < 4; attempt++) {
    if (attempt > 0) {
      await new Promise<void>((r) => setTimeout(r, 2000));
    }

    const pollRes = await fetch(
      `${BASE}/search/getResult.json?searchId=${searchId}&limit=20&sortBy=price&currency=EUR`,
      {
        headers: { "X-Access-Token": apiKey },
        signal: AbortSignal.timeout(10_000),
      },
    );

    if (!pollRes.ok) continue;

    const pollBody = await pollRes.json() as HotellookSearchResults;

    if (pollBody.status === "complete" && Array.isArray(pollBody.result)) {
      return pollBody.result;
    }

    if (pollBody.status === "error") {
      throw new Error("Hotellook search returned error status");
    }
    // status === "pending" → continue polling
  }

  // Return whatever partial results we have after 4 attempts
  return [];
}
