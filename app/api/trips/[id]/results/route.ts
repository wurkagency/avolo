// GET /api/trips/[id]/results?serviceType=FLIGHT&page=1&limit=20
// Returns paginated CachedResult rows for a trip the requester owns.

import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/server/auth";
import { getTripForSession, getCachedResults } from "@/server/services/tripService";

const PAGE_LIMIT = 20;

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  const session = await auth();
  const userId = session?.user?.id;
  const anonId = request.cookies.get("avolo_sid")?.value;

  if (!userId && !anonId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const trip = await getTripForSession(params.id, { userId, anonId });
  if (!trip) {
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  }

  const { searchParams } = request.nextUrl;
  const serviceType = searchParams.get("serviceType") ?? undefined;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));

  const { rows, total } = await getCachedResults(trip.id, serviceType, page, PAGE_LIMIT);

  return NextResponse.json({
    results: rows.map((r) => r.normalizedData),
    total,
    page,
    pages: Math.max(1, Math.ceil(total / PAGE_LIMIT)),
  });
}
