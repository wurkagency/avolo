import { NextResponse, type NextRequest } from "next/server";
import { findNearbyAirports } from "@/lib/server/airportGeo";

/**
 * GET /api/airports/nearby?iata=CPH&radius=100
 * Returns airports within radiusKm of the given IATA code, sorted by distance.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const iata = request.nextUrl.searchParams.get("iata")?.trim().toUpperCase() ?? "";
  const radius = Math.min(200, parseInt(request.nextUrl.searchParams.get("radius") ?? "100", 10));

  if (!/^[A-Z]{3}$/.test(iata)) {
    return NextResponse.json({ airports: [] });
  }

  const nearby = findNearbyAirports(iata, radius);
  const airports = nearby.map((a) => ({
    iataCode: a.iataCode,
    name: a.name,
    municipality: a.municipality,
    country: a.country,
  }));

  return NextResponse.json(
    { airports },
    { headers: { "Cache-Control": "public, s-maxage=86400" } },
  );
}
