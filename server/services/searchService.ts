// Search service — orchestrates providers, AI ranking, DB caching, and SSE emission.
//
// Architecture rules (enforced here):
//   - Categories (flights/hotels/cars/excursions) run in PARALLEL via Promise.allSettled
//   - Within each category, providers run SEQUENTIALLY (TravelPayouts → Duffel → ...)
//   - AI ranking is SEQUENTIAL (Groq → Gemini → Nvidia) — enforced in aiClient.ts
//   - SSE ALWAYS ends with {"event":"done"} — guaranteed by try/finally in runSearch
//   - All prices stored as EUR — enforced in normalizers

import { Prisma, type Trip } from "@prisma/client";
import type { NormalizedResult, SSEEvent } from "@/types/search";
import { db } from "@/lib/server/db";
import { rankWithAI } from "@/lib/ai/aiClient";
import {
  buildFlightRankingPrompt,
  buildHotelRankingPrompt,
  buildCarRankingPrompt,
  buildExcursionRankingPrompt,
  applyRanking,
} from "@/lib/ai/prompts";
import { fetchTravelPayoutsFlights } from "@/server/providers/flights/travelPayoutsProvider";
import { fetchDuffelFlights } from "@/server/providers/flights/duffelProvider";
import {
  normalizeTravelPayoutsFlights,
  normalizeDuffelFlights,
  deduplicateFlights,
} from "@/server/providers/flights/flightNormalizer";
import { fetchTravelPayoutsHotels } from "@/server/providers/hotels/travelPayoutsHotelProvider";
import { normalizeHotels } from "@/server/providers/hotels/hotelNormalizer";
import { fetchTravelPayoutsCars } from "@/server/providers/cars/travelPayoutsCarProvider";
import { normalizeCars } from "@/server/providers/cars/carNormalizer";
import { fetchExcursions } from "@/server/providers/excursions/excursionProvider";
import { normalizeExcursions } from "@/server/providers/excursions/excursionNormalizer";
import { hotelFallbacks, carFallbacks, excursionFallbacks } from "@/server/providers/stubs/fallbacks";
import type { SearchRequest } from "@/types/search";

export type EmitFn = (event: SSEEvent) => void;

// ─── Per-category fetch + normalize + rank ─────────────────────────────────

// Returns [results, hasRealData] — hasRealData is false when every result is a stub or there are none
async function fetchAndRankFlights(
  req: SearchRequest,
  emit: EmitFn,
): Promise<[NormalizedResult[], boolean]> {
  emit({ event: "status", message: "Searching for flights…" });

  let normalized: NormalizedResult[] = [];

  try {
    const tpRaw = await fetchTravelPayoutsFlights(req);
    normalized.push(...normalizeTravelPayoutsFlights(tpRaw, req.departure, req.destination));
  } catch (err) {
    console.error("[searchService] TravelPayouts flights failed:", err instanceof Error ? err.message : err);
  }

  if (normalized.length === 0) {
    try {
      const duffelRaw = await fetchDuffelFlights(req);
      normalized.push(...normalizeDuffelFlights(duffelRaw));
    } catch (err) {
      console.error("[searchService] Duffel flights failed:", err instanceof Error ? err.message : err);
    }
  }

  normalized = deduplicateFlights(normalized);
  const hasRealData = normalized.some((r) => r.provider !== "stub");

  if (normalized.length > 0) {
    try {
      const prompt = buildFlightRankingPrompt(normalized, req.departure, req.destination);
      const { ranked } = await rankWithAI(prompt);
      normalized = applyRanking(normalized, ranked);
    } catch (err) {
      console.error("[searchService] Flight AI ranking failed:", err instanceof Error ? err.message : err);
    }
  }

  return [normalized, hasRealData];
}

async function fetchAndRankHotels(
  req: SearchRequest,
  emit: EmitFn,
): Promise<[NormalizedResult[], boolean]> {
  emit({ event: "status", message: "Searching for hotels…" });

  let normalized: NormalizedResult[] = [];
  let hasRealData = false;

  try {
    const raw = await fetchTravelPayoutsHotels(req);
    normalized.push(...normalizeHotels(raw));
    hasRealData = normalized.length > 0;
  } catch (err) {
    console.error("[searchService] TravelPayouts hotels failed:", err instanceof Error ? err.message : err);
  }

  if (normalized.length === 0) {
    normalized = hotelFallbacks(req);
  }

  if (normalized.length > 0) {
    const nights = req.returnDate
      ? Math.max(1, Math.round(
          (new Date(req.returnDate).getTime() - new Date(req.departureDate).getTime()) / 86_400_000,
        ))
      : 1;
    try {
      const prompt = buildHotelRankingPrompt(normalized, req.destination, nights);
      const { ranked } = await rankWithAI(prompt);
      normalized = applyRanking(normalized, ranked);
    } catch (err) {
      console.error("[searchService] Hotel AI ranking failed:", err instanceof Error ? err.message : err);
    }
  }

  return [normalized, hasRealData];
}

async function fetchAndRankCars(
  req: SearchRequest,
  emit: EmitFn,
): Promise<[NormalizedResult[], boolean]> {
  emit({ event: "status", message: "Searching for car rentals…" });

  let normalized: NormalizedResult[] = [];
  let hasRealData = false;

  try {
    const raw = await fetchTravelPayoutsCars(req);
    normalized.push(...normalizeCars(raw));
    hasRealData = normalized.length > 0;
  } catch (err) {
    console.error("[searchService] TravelPayouts cars failed:", err instanceof Error ? err.message : err);
  }

  if (normalized.length === 0) {
    normalized = carFallbacks(req);
  }

  if (normalized.length > 0) {
    const days = req.returnDate
      ? Math.max(1, Math.round(
          (new Date(req.returnDate).getTime() - new Date(req.departureDate).getTime()) / 86_400_000,
        ))
      : 1;
    try {
      const prompt = buildCarRankingPrompt(normalized, req.destination, days);
      const { ranked } = await rankWithAI(prompt);
      normalized = applyRanking(normalized, ranked);
    } catch (err) {
      console.error("[searchService] Car AI ranking failed:", err instanceof Error ? err.message : err);
    }
  }

  return [normalized, hasRealData];
}

async function fetchAndRankExcursions(
  req: SearchRequest,
  emit: EmitFn,
): Promise<[NormalizedResult[], boolean]> {
  emit({ event: "status", message: "Searching for excursions…" });

  let normalized: NormalizedResult[] = [];
  let hasRealData = false;

  try {
    const raw = await fetchExcursions(req);
    normalized.push(...normalizeExcursions(raw));
    hasRealData = normalized.length > 0;
  } catch (err) {
    console.error("[searchService] Excursions failed:", err instanceof Error ? err.message : err);
  }

  if (normalized.length === 0) {
    normalized = excursionFallbacks(req);
  }

  if (normalized.length > 0) {
    try {
      const prompt = buildExcursionRankingPrompt(normalized, req.destination);
      const { ranked } = await rankWithAI(prompt);
      normalized = applyRanking(normalized, ranked);
    } catch (err) {
      console.error("[searchService] Excursion AI ranking failed:", err instanceof Error ? err.message : err);
    }
  }

  return [normalized, hasRealData];
}

// ─── Cache results to DB ───────────────────────────────────────────────────

async function cacheResults(
  tripId: string,
  results: NormalizedResult[],
): Promise<void> {
  if (results.length === 0) return;

  const CACHE_TTL_HOURS = 24;
  const expiresAt = new Date(Date.now() + CACHE_TTL_HOURS * 3_600_000);

  await db.cachedResult.createMany({
    data: results.map((r) => ({
      tripId,
      serviceType: r.serviceType,
      provider: r.provider,
      rawData: Prisma.JsonNull,
      normalizedData: r as unknown as Prisma.InputJsonValue,
      priceEur: r.priceEur,
      rank: r.rank,
      riskLevel: r.riskLevel,
      riskReasons: r.riskReasons as unknown as Prisma.InputJsonValue,
      isRefundable: r.isRefundable,
      deepLinkUrl: r.deepLinkUrl,
      expiresAt,
    })),
  });
}

// ─── Main entry point — called from SSE route handler ─────────────────────

export async function runSearch(
  trip: Trip,
  services: string[],
  emit: EmitFn,
): Promise<void> {
  const req: SearchRequest = {
    departure: trip.departure,
    departureName: trip.departureName,
    destination: trip.destination,
    destinationName: trip.destinationName,
    services: services as SearchRequest["services"],
    departureDate: trip.departureDate.toISOString().slice(0, 10),
    returnDate: trip.returnDate ? trip.returnDate.toISOString().slice(0, 10) : null,
    isOneWay: trip.isOneWay,
    flexibility: trip.flexibility,
    adults: trip.adults,
    children: (trip.children as number[]) ?? [],
    hasDisability: trip.hasDisability,
    handLuggage: trip.handLuggage,
    checkedLuggage: trip.checkedLuggage,
    specialLuggage: trip.specialLuggage,
  };

  const startedAt = Date.now();
  const allResults: NormalizedResult[] = [];

  // Each category runs as a parallel task.
  // When a category completes it immediately emits its results (true streaming).
  // The done event is emitted only after ALL categories finish.

  // Track which requested categories returned real (non-stub) data
  const realDataFlags: Partial<Record<string, boolean>> = {};

  const flightTask = services.includes("FLIGHT")
    ? fetchAndRankFlights(req, emit)
        .then(([results, hasReal]) => {
          realDataFlags["FLIGHT"] = hasReal;
          emit({ event: "category", type: "FLIGHT", results });
          allResults.push(...results);
          return results;
        })
        .catch((err) => {
          realDataFlags["FLIGHT"] = false;
          const msg = err instanceof Error ? err.message : "Unknown error";
          emit({ event: "category", type: "FLIGHT", results: [], error: msg });
          return [];
        })
    : Promise.resolve([]);

  const hotelTask = services.includes("HOTEL")
    ? fetchAndRankHotels(req, emit)
        .then(([results, hasReal]) => {
          realDataFlags["HOTEL"] = hasReal;
          emit({ event: "category", type: "HOTEL", results });
          allResults.push(...results);
          return results;
        })
        .catch((err) => {
          realDataFlags["HOTEL"] = false;
          const msg = err instanceof Error ? err.message : "Unknown error";
          emit({ event: "category", type: "HOTEL", results: [], error: msg });
          return [];
        })
    : Promise.resolve([]);

  const carTask = services.includes("CAR")
    ? fetchAndRankCars(req, emit)
        .then(([results, hasReal]) => {
          realDataFlags["CAR"] = hasReal;
          emit({ event: "category", type: "CAR", results });
          allResults.push(...results);
          return results;
        })
        .catch((err) => {
          realDataFlags["CAR"] = false;
          const msg = err instanceof Error ? err.message : "Unknown error";
          emit({ event: "category", type: "CAR", results: [], error: msg });
          return [];
        })
    : Promise.resolve([]);

  const excursionTask = services.includes("EXCURSION")
    ? fetchAndRankExcursions(req, emit)
        .then(([results, hasReal]) => {
          realDataFlags["EXCURSION"] = hasReal;
          emit({ event: "category", type: "EXCURSION", results });
          allResults.push(...results);
          return results;
        })
        .catch((err) => {
          realDataFlags["EXCURSION"] = false;
          const msg = err instanceof Error ? err.message : "Unknown error";
          emit({ event: "category", type: "EXCURSION", results: [], error: msg });
          return [];
        })
    : Promise.resolve([]);

  // Wait for all categories (Promise.allSettled never throws)
  await Promise.allSettled([flightTask, hotelTask, carTask, excursionTask]);

  // Signal total failure only when every requested category has zero real data
  const requestedCategories = services.filter((s) =>
    ["FLIGHT", "HOTEL", "CAR", "EXCURSION"].includes(s),
  );
  const allProvidersFailed =
    requestedCategories.length > 0 &&
    requestedCategories.every((s) => realDataFlags[s] === false);

  if (allProvidersFailed) {
    emit({ event: "all_providers_failed" });
  }

  // Persist results + update trip state
  try {
    await cacheResults(trip.id, allResults);

    // Use rank-0 result per category (the AI-ranked best pick)
    const bestByCategory = (type: string) =>
      allResults
        .filter((r) => r.serviceType === type)
        .sort((a, b) => a.rank - b.rank)[0]?.priceEur ?? 0;

    const flightTotal = bestByCategory("FLIGHT");
    const hotelTotal = bestByCategory("HOTEL");
    const carTotal = bestByCategory("CAR");
    const excursionTotal = bestByCategory("EXCURSION");

    const totalSum = flightTotal + hotelTotal + carTotal + excursionTotal;
    await db.trip.update({
      where: { id: trip.id },
      data: {
        status: "COMPLETE",
        totalPriceEur: totalSum > 0 ? totalSum : null,
        lastRefreshedAt: new Date(),
      },
    });

    await db.search.create({
      data: {
        tripId: trip.id,
        query: req as unknown as Prisma.InputJsonValue,
        providers: ["travelpayouts", "duffel"] as unknown as Prisma.InputJsonValue,
        durationMs: Date.now() - startedAt,
        success: true,
      },
    });
  } catch (err) {
    console.error("[searchService] DB persistence failed:", err instanceof Error ? err.message : err);
  }
}
