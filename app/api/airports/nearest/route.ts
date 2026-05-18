import { NextResponse, type NextRequest } from "next/server";
import { findNearestAirportByCoords } from "@/lib/server/airportGeo";

/**
 * GET /api/airports/nearest?lat=55.67&lng=12.56
 * Returns the nearest major airport to the given coordinates.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const lat = parseFloat(request.nextUrl.searchParams.get("lat") ?? "");
  const lng = parseFloat(request.nextUrl.searchParams.get("lng") ?? "");

  if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return NextResponse.json({ airport: null }, { status: 400 });
  }

  const airport = findNearestAirportByCoords(lat, lng);
  if (!airport) return NextResponse.json({ airport: null });

  return NextResponse.json(
    {
      airport: {
        iataCode:    airport.iataCode,
        name:        airport.name,
        municipality: airport.municipality,
        country:     airport.country,
      },
    },
    { headers: { "Cache-Control": "public, s-maxage=3600" } },
  );
}
