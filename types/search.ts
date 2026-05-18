// Core search types — the contract between providers, AI, DB, and client

import type { ServiceType, Flexibility } from "@/types/trip";

// ─── Slot labels per category ──────────────────────────────────────────────

export type FlightSlot = "BEST_VALUE" | "CHEAPEST" | "FASTEST";
export type HotelSlot = "BEST_VALUE" | "CHEAPEST" | "BEST_RATED" | "MOST_CENTRAL";
export type CarSlot = "BEST_VALUE" | "CHEAPEST" | "CLOSEST_PICKUP" | "BEST_COVERED";
export type ExcursionSlot = "BEST_EXPERIENCE" | "MUST_SEE" | "HIDDEN_GEM" | "BEST_BUDGET";
export type AiSlot = FlightSlot | HotelSlot | CarSlot | ExcursionSlot;

// ─── Per-category details ──────────────────────────────────────────────────

export interface FlightDetails {
  airline: string;
  airlineCode: string;
  stops: number;
  durationMinutes: number;
  departureTime: string;   // ISO datetime
  arrivalTime: string;     // ISO datetime
  departureAirport: string; // IATA
  arrivalAirport: string;   // IATA
  cabin: string;
  baggage: string;
  returnFlight: {
    departureTime: string;
    arrivalTime: string;
    durationMinutes: number;
    stops: number;
  } | null;
}

export interface HotelDetails {
  name: string;
  stars: number;
  rating: number | null;
  reviewCount: number | null;
  address: string;
  distanceFromCenterKm: number | null;
  checkIn: string;    // ISO date
  checkOut: string;   // ISO date
  nights: number;
  roomType: string;
  breakfast: boolean;
  cancellationPolicy: string;
  imageUrl: string | null;
}

export interface CarDetails {
  make: string;
  model: string;
  category: string;   // economy | compact | suv | van | luxury
  seats: number;
  pickupLocation: string;
  dropoffLocation: string;
  pickupDate: string;
  dropoffDate: string;
  days: number;
  insurance: string;
  supplier: string;
  imageUrl: string | null;
}

export interface ExcursionDetails {
  title: string;
  description: string;
  durationHours: number;
  category: string;  // culture | food | nature | adventure
  location: string;
  date: string;
  includes: string[];
  groupSize: string | null;
  imageUrl: string | null;
}

// ─── NormalizedResult — the universal output shape ─────────────────────────

export interface NormalizedResult {
  id: string;              // provider-specific unique ID
  serviceType: ServiceType;
  provider: string;        // e.g. "travelpayouts", "duffel"
  priceEur: number;        // ALWAYS EUR — never another currency
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  riskReasons: string[];
  isRefundable: boolean;
  deepLinkUrl: string;
  rank: number;            // 0-based after AI ranking (0 = best)
  aiSlot: AiSlot | null;
  aiSummary: string | null;
  flight: FlightDetails | null;
  hotel: HotelDetails | null;
  car: CarDetails | null;
  excursion: ExcursionDetails | null;
}

// ─── Search request (from POST /api/search-trip body) ─────────────────────

export interface SearchRequest {
  departure: string;       // IATA
  departureName: string;
  destination: string;     // IATA
  destinationName: string;
  /** Extra IATA codes when user selects "All airports near X" */
  departureAirports?: string[];
  destinationAirports?: string[];
  services: ServiceType[];
  departureDate: string;   // ISO date
  returnDate: string | null;
  isOneWay: boolean;
  flexibility: Flexibility;
  adults: number;
  children: number[];      // ages
  hasDisability: boolean;
  handLuggage: number;
  checkedLuggage: number;
  specialLuggage: boolean;
}

// ─── SSE event types ───────────────────────────────────────────────────────

export type SSEEvent =
  | { event: "status"; message: string }
  | { event: "category"; type: ServiceType; results: NormalizedResult[]; error?: string }
  | { event: "done" }
  | { event: "error"; message: string };

// ─── AI ranking response ───────────────────────────────────────────────────

export interface AiRankedItem {
  id: string;
  rank: number;
  slot: AiSlot;
  summary: string;
}

export interface AiRankingResponse {
  ranked: AiRankedItem[];
}
