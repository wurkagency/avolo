// Regex-based fallback parser — runs when all AI providers fail.
// Handles the most common natural-language query patterns without an LLM.

import type { TripDraft, ServiceType, Flexibility } from "@/types/trip";
import { loadAirportGeo } from "@/lib/server/airportGeo";

// ─── Date helpers ─────────────────────────────────────────────────────────────

const MONTHS: Record<string, number> = {
  january: 1, jan: 1, february: 2, feb: 2, march: 3, mar: 3,
  april: 4,   apr: 4, may: 5,      june: 6, jun: 6,
  july: 7,    jul: 7, august: 8,   aug: 8, september: 9, sep: 9, sept: 9,
  october: 10, oct: 10, november: 11, nov: 11, december: 12, dec: 12,
};

function toIso(day: number, month: number, year: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function parseDates(q: string, today: Date): { departureDate: string | null; returnDate: string | null } {
  const lower = q.toLowerCase();
  const year  = today.getFullYear();
  const curMo = today.getMonth() + 1;

  // "July 20th to 26th" or "July 20 to 26"
  const spanSameMonth = /\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\s+(\d{1,2})(?:st|nd|rd|th)?\s+(?:to|-)\s+(\d{1,2})(?:st|nd|rd|th)?/i.exec(lower);
  if (spanSameMonth) {
    const mo = MONTHS[spanSameMonth[1]!.toLowerCase()];
    const d1 = parseInt(spanSameMonth[2]!);
    const d2 = parseInt(spanSameMonth[3]!);
    if (mo && d1 && d2) {
      const useYear = mo < curMo ? year + 1 : year;
      return { departureDate: toIso(d1, mo, useYear), returnDate: toIso(d2, mo, useYear) };
    }
  }

  // "20th July to 26th July" or "20 July to 26 August"
  const spanExplicit = /\b(\d{1,2})(?:st|nd|rd|th)?\s+(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\s+(?:to|-)\s+(\d{1,2})(?:st|nd|rd|th)?\s+(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)/i.exec(lower);
  if (spanExplicit) {
    const d1 = parseInt(spanExplicit[1]!);
    const mo1 = MONTHS[spanExplicit[2]!.toLowerCase()];
    const d2 = parseInt(spanExplicit[3]!);
    const mo2 = MONTHS[spanExplicit[4]!.toLowerCase()];
    if (d1 && mo1 && d2 && mo2) {
      const useYear1 = mo1 < curMo ? year + 1 : year;
      const useYear2 = mo2 < curMo ? year + 1 : year;
      return { departureDate: toIso(d1, mo1, useYear1), returnDate: toIso(d2, mo2, useYear2) };
    }
  }

  // Single date: "July 20th" or "20th July"
  const single1 = /\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\s+(\d{1,2})(?:st|nd|rd|th)?/i.exec(lower);
  if (single1) {
    const mo = MONTHS[single1[1]!.toLowerCase()];
    const d  = parseInt(single1[2]!);
    if (mo && d) {
      const useYear = mo < curMo ? year + 1 : year;
      return { departureDate: toIso(d, mo, useYear), returnDate: null };
    }
  }
  const single2 = /\b(\d{1,2})(?:st|nd|rd|th)?\s+(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)/i.exec(lower);
  if (single2) {
    const d  = parseInt(single2[1]!);
    const mo = MONTHS[single2[2]!.toLowerCase()];
    if (mo && d) {
      const useYear = mo < curMo ? year + 1 : year;
      return { departureDate: toIso(d, mo, useYear), returnDate: null };
    }
  }

  return { departureDate: null, returnDate: null };
}

// ─── Service extraction ───────────────────────────────────────────────────────

function parseServices(q: string): ServiceType[] {
  const lower = q.toLowerCase();
  const services: ServiceType[] = [];
  if (/\b(flight|fly|plane|airline|ticket)\b/.test(lower)) services.push("FLIGHT");
  if (/\b(hotel|stay|accommodation|lodging|room|hostel)\b/.test(lower)) services.push("HOTEL");
  if (/\b(car|drive|rental|hire|vehicle)\b/.test(lower)) services.push("CAR");
  if (/\b(excursion|tour|activity|activities|sightseeing|explore)\b/.test(lower)) services.push("EXCURSION");
  return services.length > 0 ? services : ["FLIGHT"];
}

// ─── Travelers extraction ─────────────────────────────────────────────────────

function parseTravelers(q: string): { adults: number; children: number[] } {
  const adultMatch = /(\d+)\s+adult/i.exec(q);
  const adults = adultMatch ? Math.min(9, Math.max(1, parseInt(adultMatch[1]!))) : 1;

  const childrenMatch = /(\d+)\s+child(?:ren)?/i.exec(q);
  const childCount = childrenMatch ? Math.min(8, parseInt(childrenMatch[1]!)) : 0;
  const children = Array(childCount).fill(8) as number[]; // default age 8

  return { adults, children };
}

// ─── Airport lookup by city name ──────────────────────────────────────────────

function findAirportForCity(cityName: string) {
  if (!cityName.trim()) return null;
  const lower = cityName.toLowerCase().trim();
  const airports = loadAirportGeo();

  // Exact municipality match first
  const exact = airports.find((a) => (a.municipality ?? "").toLowerCase() === lower);
  if (exact) return { iata: exact.iataCode, name: `${exact.municipality ?? exact.name} (${exact.iataCode})` };

  // Name contains city (e.g. "Copenhagen Airport" for "Copenhagen")
  const partial = airports.find(
    (a) =>
      (a.municipality ?? "").toLowerCase().includes(lower) ||
      lower.includes((a.municipality ?? "").toLowerCase()) ||
      a.name.toLowerCase().includes(lower),
  );
  if (partial) return { iata: partial.iataCode, name: `${partial.municipality ?? partial.name} (${partial.iataCode})` };

  return null;
}

// ─── Route extraction ─────────────────────────────────────────────────────────

function parseRoute(q: string) {
  const lower = q.toLowerCase();

  // "Copenhagen to Miami" or "from Copenhagen to Miami"
  const routeMatch = /(?:from\s+)?([a-z\s]+?)\s+to\s+([a-z\s]+?)(?:\s*[,.]|\s+(?:july|august|january|february|march|april|may|june|september|october|november|december|\d{1,2}|on |in ))/i.exec(lower);
  if (routeMatch) {
    const dep  = routeMatch[1]?.trim();
    const dest = routeMatch[2]?.trim();
    const depAirport  = dep  ? findAirportForCity(dep)  : null;
    const destAirport = dest ? findAirportForCity(dest) : null;
    return { departure: depAirport, destination: destAirport };
  }

  // Simpler fallback: word before "to" and word(s) after "to"
  const simpleMatch = /\b(\w+(?:\s+\w+)?)\s+to\s+(\w+(?:\s+\w+)?)/i.exec(q);
  if (simpleMatch) {
    const dep  = simpleMatch[1]?.trim();
    const dest = simpleMatch[2]?.trim();
    const depAirport  = dep  ? findAirportForCity(dep)  : null;
    const destAirport = dest ? findAirportForCity(dest) : null;
    if (depAirport || destAirport) return { departure: depAirport, destination: destAirport };
  }

  return { departure: null, destination: null };
}

// ─── Flexibility ──────────────────────────────────────────────────────────────

function parseFlexibility(q: string): Flexibility {
  const lower = q.toLowerCase();
  if (/flexible|roughly|around|approximately|±\s*week|±\s*7/.test(lower)) return "PLUS_MINUS_7";
  if (/±\s*3|a few days|few days/.test(lower)) return "PLUS_MINUS_3";
  if (/±\s*1|one day/.test(lower)) return "PLUS_MINUS_1";
  return "EXACT";
}

// ─── Main entry point ─────────────────────────────────────────────────────────

export interface FallbackParseResult extends Partial<TripDraft> {
  filledFields: (keyof TripDraft)[];
}

export function fallbackParse(query: string, today: Date): FallbackParseResult {
  const filled: (keyof TripDraft)[] = [];
  const result: Partial<TripDraft> = {};

  const { departure, destination } = parseRoute(query);
  if (departure) { result.departure = departure; filled.push("departure"); }
  if (destination) { result.destination = destination; filled.push("destination"); }

  const services = parseServices(query);
  result.services = services;
  if (services.length > 1 || services[0] !== "FLIGHT") filled.push("services");

  const { departureDate, returnDate } = parseDates(query, today);
  if (departureDate) {
    const d = new Date(departureDate + "T00:00:00");
    if (d >= today) {
      result.departureDate = departureDate;
      filled.push("departureDate");
    }
  }

  const isOneWay = /\bone.?way\b/i.test(query);
  result.isOneWay = isOneWay;
  if (isOneWay) { result.returnDate = null; filled.push("isOneWay"); }
  else if (returnDate) {
    result.returnDate = returnDate;
    filled.push("returnDate");
  }

  const { adults, children } = parseTravelers(query);
  result.adults = adults;
  result.children = children;
  filled.push("adults");
  if (children.length > 0) filled.push("children");

  result.flexibility = parseFlexibility(query);
  if (result.flexibility !== "EXACT") filled.push("flexibility");

  result.hasDisability = false;
  result.handLuggage = 1;
  result.checkedLuggage = 0;
  result.specialLuggage = false;

  return { ...result, filledFields: filled };
}
