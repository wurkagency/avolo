// GET /api/trips
// Returns the authenticated (or anonymous) user's trip list.

import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/server/auth";
import { getUserTrips } from "@/server/services/tripService";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await auth();
  const userId = session?.user?.id;
  const anonId = request.cookies.get("avolo_sid")?.value;

  if (!userId && !anonId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const trips = await getUserTrips({ userId, anonId });

  return NextResponse.json({
    trips: trips.map((t) => ({
      id: t.id,
      departure: t.departure,
      departureName: t.departureName,
      destination: t.destination,
      destinationName: t.destinationName,
      departureDate: t.departureDate.toISOString().slice(0, 10),
      returnDate: t.returnDate ? t.returnDate.toISOString().slice(0, 10) : null,
      isOneWay: t.isOneWay,
      adults: t.adults,
      status: t.status,
      totalPriceEur: t.totalPriceEur,
      lastRefreshedAt: t.lastRefreshedAt?.toISOString() ?? null,
      createdAt: t.createdAt.toISOString(),
      services: t.services.map((s) => s.type),
    })),
    isAnonymous: !userId,
  });
}
