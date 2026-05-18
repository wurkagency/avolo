// TravelPayouts Hotellook Hotel Search API.
// Two-step: start search → poll for results.

import type { SearchRequest } from "@/types/search";

const BASE = "https://engine.hotellook.com/api/v2";

// Hotellook requires city IATA codes, not airport IATA codes.
// For single-airport cities (CPH, AMS, BCN) these are the same.
// For multi-airport cities (London = LON, Paris = PAR, etc.) we must map.
const AIRPORT_TO_CITY: Record<string, string> = {
  // United Kingdom
  LHR: "LON", LGW: "LON", LCY: "LON", STN: "LON", LTN: "LON",
  // France
  CDG: "PAR", ORY: "PAR",
  // USA – New York
  JFK: "NYC", EWR: "NYC", LGA: "NYC",
  // USA – Chicago
  ORD: "CHI", MDW: "CHI",
  // USA – Dallas
  DFW: "DFW", DAL: "DFW",
  // USA – Washington DC
  IAD: "WAS", DCA: "WAS", BWI: "WAS",
  // USA – Houston
  IAH: "HOU", HOU: "HOU",
  // Japan – Tokyo
  NRT: "TYO", HND: "TYO",
  // China – Shanghai
  PVG: "SHA", SHA: "SHA",
  // China – Beijing
  PEK: "BJS", PKX: "BJS",
  // Italy – Rome
  FCO: "ROM", CIA: "ROM",
  // Italy – Milan
  MXP: "MIL", LIN: "MIL", BGY: "MIL",
  // Sweden – Stockholm
  ARN: "STO", BMA: "STO", NYO: "STO",
  // Brazil – São Paulo
  GRU: "SAO", CGH: "SAO", VCP: "SAO",
  // Turkey – Istanbul
  SAW: "IST",
  // Germany – Berlin
  BER: "BER", TXL: "BER", SXF: "BER",
  // Russia – Moscow
  SVO: "MOW", DME: "MOW", VKO: "MOW",
  // UAE – Dubai
  DXB: "DXB", DWC: "DXB",
};

function toCityIata(airportCode: string): string {
  return AIRPORT_TO_CITY[airportCode.toUpperCase()] ?? airportCode;
}

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

  const cityIata = toCityIata(req.destination);

  // Step 1: start search
  const startRes = await fetch(`${BASE}/search/start.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Access-Token": apiKey,
    },
    body: JSON.stringify({
      query: {
        destination: cityIata, // city IATA code (mapped from airport code)
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

  // Step 2: poll for results (max 6 attempts, 2s apart = up to 12s)
  for (let attempt = 0; attempt < 6; attempt++) {
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
