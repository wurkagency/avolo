import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/server/db";
import { loadAirportsFromCsv } from "@/lib/server/airportCsv";
import type { AirportOption } from "@/types/trip";

// In-memory cache — populated on first request, static for the process lifetime
let airportCache: AirportOption[] | null = null;

async function getAirportCache(): Promise<AirportOption[]> {
  if (airportCache !== null) return airportCache;

  try {
    const rows = await db.airport.findMany({
      where: { iataCode: { not: null } },
      select: { iataCode: true, name: true, municipality: true, country: true },
      orderBy: [{ scheduledService: "desc" }, { name: "asc" }],
    });

    const dbAirports = rows
      .filter((r): r is AirportOption & { iataCode: string } => r.iataCode !== null)
      .map((r) => ({ iataCode: r.iataCode, name: r.name, municipality: r.municipality, country: r.country }));

    if (dbAirports.length > 0) {
      airportCache = dbAirports;
      return airportCache;
    }
  } catch {
    // DB unavailable — fall through to CSV
  }

  // DB empty or unavailable — load from bundled CSV
  airportCache = loadAirportsFromCsv();
  return airportCache;
}

/**
 * GET /api/airports?q=<term>
 * Returns up to 10 airports matching the query (IATA code, city, or name).
 * In-memory search against a cached list loaded from MySQL on first request.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (q.length < 2) {
    return NextResponse.json({ airports: [] });
  }

  try {
    const cache = await getAirportCache();
    const lower = q.toLowerCase();
    const exact = q.toUpperCase();

    const matches = cache
      .filter(
        (a) =>
          a.iataCode.toUpperCase().includes(exact) ||
          (a.municipality ?? "").toLowerCase().includes(lower) ||
          a.name.toLowerCase().includes(lower) ||
          a.country.toLowerCase().includes(lower),
      )
      .sort((a, b) => {
        // Priority: exact IATA match → IATA starts with → city starts with → rest
        const aExact = a.iataCode.toUpperCase() === exact ? 0 : 1;
        const bExact = b.iataCode.toUpperCase() === exact ? 0 : 1;
        if (aExact !== bExact) return aExact - bExact;

        const aPrefix = a.iataCode.toUpperCase().startsWith(exact) ? 0 : 1;
        const bPrefix = b.iataCode.toUpperCase().startsWith(exact) ? 0 : 1;
        if (aPrefix !== bPrefix) return aPrefix - bPrefix;

        const aCityPrefix = (a.municipality ?? "").toLowerCase().startsWith(lower) ? 0 : 1;
        const bCityPrefix = (b.municipality ?? "").toLowerCase().startsWith(lower) ? 0 : 1;
        if (aCityPrefix !== bCityPrefix) return aCityPrefix - bCityPrefix;

        return a.name.localeCompare(b.name);
      })
      .slice(0, 10);

    return NextResponse.json(
      { airports: matches },
      { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } },
    );
  } catch (error) {
    console.error("[airports] Search failed:", error);
    return NextResponse.json({ airports: [] }, { status: 500 });
  }
}
