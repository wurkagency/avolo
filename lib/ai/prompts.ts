// AI prompt builders — one per category.
// Each builds a prompt that returns AiRankingResponse JSON.

import type { NormalizedResult, AiSlot } from "@/types/search";

// ─── Shared JSON schema instruction ───────────────────────────────────────

const JSON_SCHEMA = `
Respond ONLY with valid JSON matching this schema (no markdown, no explanation):
{
  "ranked": [
    {
      "id": "<result id>",
      "rank": <0-based integer, 0 = best>,
      "slot": "<slot label>",
      "summary": "<one sentence explaining why this option stands out>"
    }
  ]
}`;

// ─── Condensed result for prompt input ────────────────────────────────────

interface CondensedFlight {
  id: string;
  priceEur: number;
  airline: string;
  stops: number;
  durationMinutes: number;
  isRefundable: boolean;
  riskLevel: string;
}

interface CondensedHotel {
  id: string;
  priceEur: number;
  name: string;
  stars: number;
  rating: number | null;
  distanceFromCenterKm: number | null;
  isRefundable: boolean;
  breakfast: boolean;
}

interface CondensedCar {
  id: string;
  priceEur: number;
  make: string;
  model: string;
  category: string;
  seats: number;
  insurance: string;
  pickupLocation: string;
}

interface CondensedExcursion {
  id: string;
  priceEur: number;
  title: string;
  category: string;
  durationHours: number;
  includes: string[];
}

// ─── Flight ranking prompt ─────────────────────────────────────────────────

export function buildFlightRankingPrompt(
  results: NormalizedResult[],
  departure: string,
  destination: string,
): string {
  const slots: FlightSlot[] = ["BEST_VALUE", "CHEAPEST", "FASTEST"];
  type FlightSlot = "BEST_VALUE" | "CHEAPEST" | "FASTEST";

  const condensed: CondensedFlight[] = results.map((r) => ({
    id: r.id,
    priceEur: r.priceEur,
    airline: r.flight?.airline ?? "",
    stops: r.flight?.stops ?? 0,
    durationMinutes: r.flight?.durationMinutes ?? 0,
    isRefundable: r.isRefundable,
    riskLevel: r.riskLevel,
  }));

  return `You are a flight pricing analyst. Rank the following flights from ${departure} to ${destination}.

Available slot labels (assign one per result, use each label at most once): ${slots.join(", ")}
- BEST_VALUE: best balance of price, duration, comfort, and risk
- CHEAPEST: absolute lowest total price regardless of comfort
- FASTEST: shortest total travel time including stops

Flights to rank (JSON):
${JSON.stringify(condensed, null, 2)}

${JSON_SCHEMA}`;
}

// ─── Hotel ranking prompt ──────────────────────────────────────────────────

export function buildHotelRankingPrompt(
  results: NormalizedResult[],
  destination: string,
  nights: number,
): string {
  type HotelSlot = "BEST_VALUE" | "CHEAPEST" | "BEST_RATED" | "MOST_CENTRAL";
  const slots: HotelSlot[] = ["BEST_VALUE", "CHEAPEST", "BEST_RATED", "MOST_CENTRAL"];

  const condensed: CondensedHotel[] = results.map((r) => ({
    id: r.id,
    priceEur: r.priceEur,
    name: r.hotel?.name ?? "",
    stars: r.hotel?.stars ?? 0,
    rating: r.hotel?.rating ?? null,
    distanceFromCenterKm: r.hotel?.distanceFromCenterKm ?? null,
    isRefundable: r.isRefundable,
    breakfast: r.hotel?.breakfast ?? false,
  }));

  return `You are a hotel pricing analyst. Rank the following hotels in ${destination} for ${nights} nights.

Available slot labels (assign one per result, use each at most once): ${slots.join(", ")}
- BEST_VALUE: best mix of price, stars, rating, and location
- CHEAPEST: lowest total price regardless of comfort
- BEST_RATED: highest guest rating / most reviews
- MOST_CENTRAL: closest to city centre

Hotels to rank (JSON):
${JSON.stringify(condensed, null, 2)}

${JSON_SCHEMA}`;
}

// ─── Car rental ranking prompt ─────────────────────────────────────────────

export function buildCarRankingPrompt(
  results: NormalizedResult[],
  destination: string,
  days: number,
): string {
  type CarSlot = "BEST_VALUE" | "CHEAPEST" | "CLOSEST_PICKUP" | "BEST_COVERED";
  const slots: CarSlot[] = ["BEST_VALUE", "CHEAPEST", "CLOSEST_PICKUP", "BEST_COVERED"];

  const condensed: CondensedCar[] = results.map((r) => ({
    id: r.id,
    priceEur: r.priceEur,
    make: r.car?.make ?? "",
    model: r.car?.model ?? "",
    category: r.car?.category ?? "",
    seats: r.car?.seats ?? 0,
    insurance: r.car?.insurance ?? "",
    pickupLocation: r.car?.pickupLocation ?? "",
  }));

  return `You are a car rental analyst. Rank the following car rentals in ${destination} for ${days} days.

Available slot labels (assign one per result, use each at most once): ${slots.join(", ")}
- BEST_VALUE: best balance of price, vehicle size, and insurance
- CHEAPEST: lowest total price regardless of category
- CLOSEST_PICKUP: most convenient pickup location (airport preferred)
- BEST_COVERED: best insurance / lowest risk

Cars to rank (JSON):
${JSON.stringify(condensed, null, 2)}

${JSON_SCHEMA}`;
}

// ─── Excursion ranking prompt ──────────────────────────────────────────────

export function buildExcursionRankingPrompt(
  results: NormalizedResult[],
  destination: string,
): string {
  type ExcursionSlot = "BEST_EXPERIENCE" | "MUST_SEE" | "HIDDEN_GEM" | "BEST_BUDGET";
  const slots: ExcursionSlot[] = ["BEST_EXPERIENCE", "MUST_SEE", "HIDDEN_GEM", "BEST_BUDGET"];

  const condensed: CondensedExcursion[] = results.map((r) => ({
    id: r.id,
    priceEur: r.priceEur,
    title: r.excursion?.title ?? "",
    category: r.excursion?.category ?? "",
    durationHours: r.excursion?.durationHours ?? 0,
    includes: r.excursion?.includes ?? [],
  }));

  return `You are a travel experience curator. Rank the following excursions in ${destination}.

Available slot labels (assign one per result, use each at most once): ${slots.join(", ")}
- BEST_EXPERIENCE: overall highest quality experience considering duration, inclusions, and value
- MUST_SEE: iconic, unmissable experience at this destination
- HIDDEN_GEM: off-the-beaten-path, unique, or underrated experience
- BEST_BUDGET: best value for money, lowest price for meaningful experience

Excursions to rank (JSON):
${JSON.stringify(condensed, null, 2)}

${JSON_SCHEMA}`;
}

// ─── Apply AI ranking to results ───────────────────────────────────────────

export function applyRanking(
  results: NormalizedResult[],
  ranked: { id: string; rank: number; slot: AiSlot; summary: string }[],
): NormalizedResult[] {
  const rankMap = new Map(ranked.map((r) => [r.id, r]));

  return results
    .map((result) => {
      const ai = rankMap.get(result.id);
      return {
        ...result,
        rank: ai?.rank ?? 999,
        aiSlot: ai?.slot ?? null,
        aiSummary: ai?.summary ?? null,
      };
    })
    .sort((a, b) => a.rank - b.rank);
}
