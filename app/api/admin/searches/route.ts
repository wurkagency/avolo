// GET /api/admin/searches — paginated search log (ADMIN only)
// Query params: page (default 1), limit (default 20), success (true|false|all)

import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/server/auth";
import { db } from "@/lib/server/db";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = request.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
  const successFilter = searchParams.get("success");

  const where =
    successFilter === "true"
      ? { success: true }
      : successFilter === "false"
        ? { success: false }
        : {};

  const [total, searches] = await Promise.all([
    db.search.count({ where }),
    db.search.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        trip: {
          select: {
            id: true,
            departureName: true,
            destinationName: true,
          },
        },
      },
    }),
  ]);

  return NextResponse.json({
    searches: searches.map((s) => ({
      id: s.id,
      tripId: s.tripId,
      departureName: s.trip.departureName,
      destinationName: s.trip.destinationName,
      providers: s.providers,
      durationMs: s.durationMs,
      success: s.success,
      errorLog: s.errorLog ? String(s.errorLog).slice(0, 500) : null,
      createdAt: s.createdAt,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
