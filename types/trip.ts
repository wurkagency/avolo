// Shared domain types — mirrors Prisma enums without importing @prisma/client on the client

export type ServiceType = "FLIGHT" | "HOTEL" | "CAR" | "EXCURSION";

export type Flexibility =
  | "EXACT"
  | "PLUS_MINUS_1"
  | "PLUS_MINUS_3"
  | "PLUS_MINUS_7";

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export type TripStatus = "DRAFT" | "SEARCHING" | "COMPLETE" | "STALE";

export interface AirportOption {
  iataCode: string;
  name: string;
  municipality: string | null;
  country: string;
}

export interface TripDestination {
  iata: string;
  /** Human-readable label: "Paris (CDG)" */
  name: string;
}

// The complete in-progress trip being planned (before DB persistence)
export interface TripDraft {
  departure: TripDestination | null;
  destination: TripDestination | null;
  services: ServiceType[];
  departureDate: string | null; // ISO date "YYYY-MM-DD"
  returnDate: string | null; // ISO date "YYYY-MM-DD"
  isOneWay: boolean;
  flexibility: Flexibility;
  adults: number;
  children: number[]; // ages of each child
  hasDisability: boolean;
  handLuggage: number;
  checkedLuggage: number;
  specialLuggage: boolean;
}

export const defaultTripDraft: TripDraft = {
  departure: null,
  destination: null,
  services: ["FLIGHT"],
  departureDate: null,
  returnDate: null,
  isOneWay: false,
  flexibility: "EXACT",
  adults: 1,
  children: [],
  hasDisability: false,
  handLuggage: 1,
  checkedLuggage: 0,
  specialLuggage: false,
};
