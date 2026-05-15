// POST /api/trips/[id]/refresh
// Re-fetches live prices for all services in this trip.
// Deletes stale CachedResult rows, re-runs provider chain + AI ranking,
// then updates Trip.lastRefreshedAt and Trip.totalPriceEur.

import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/server/auth";
import { getTripById, getTripServices, clearCachedResults } from "@/server/services/tripService";
import { runSearch, type EmitFn } from "@/server/services/searchService";

const noopEmit: EmitFn = () => undefined;

type Params = { params: { id: string } };

export async function POST(request: NextRequest, { params }: Params): Promise<NextResponse> {
  const session = await auth();
  const userId = session?.user?.id;
  const anonId = request.cookies.get("avolo_sid")?.value;

  if (!userId && !anonId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const trip = await getTripById(params.id, { userId, anonId });
  if (!trip) return NextResponse.json({ error: "Trip not found" }, { status: 404 });

  if (trip.status === "SEARCHING") {
    return NextResponse.json({ error: "Search already in progress" }, { status: 409 });
  }

  try {
    // Clear stale cached results before re-running providers
    await clearCachedResults(params.id);

    const services = await getTripServices(params.id);

    // runSearch persists results + updates trip.status, totalPriceEur, lastRefreshedAt
    await runSearch(trip, services, noopEmit);

    // Return fresh trip summary
    const updated = await getTripById(params.id, { userId, anonId });

    return NextResponse.json({
      totalPriceEur: updated?.totalPriceEur ?? null,
      lastRefreshedAt: updated?.lastRefreshedAt?.toISOString() ?? null,
      status: updated?.status ?? "COMPLETE",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Refresh failed";
    console.error("[refresh] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
