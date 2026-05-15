// GET /api/admin/stats — aggregated platform metrics (ADMIN only)

import { NextResponse } from "next/server";
import { auth } from "@/lib/server/auth";
import { db } from "@/lib/server/db";

export async function GET(): Promise<NextResponse> {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    newUsers,
    totalTrips,
    newTrips,
    anonTrips,
    totalSearches,
    successfulSearches,
    avgDuration,
    topDestinations,
    providerBreakdown,
    serviceTypeBreakdown,
    journalCount,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    db.trip.count(),
    db.trip.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    db.trip.count({ where: { userId: null } }),
    db.search.count(),
    db.search.count({ where: { success: true } }),
    db.search.aggregate({ _avg: { durationMs: true } }),
    db.trip.groupBy({
      by: ["destination", "destinationName"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    }),
    db.cachedResult.groupBy({
      by: ["provider"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    }),
    db.cachedResult.groupBy({
      by: ["serviceType"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    }),
    db.journalArticle.count(),
  ]);

  const searchSuccessRate =
    totalSearches > 0 ? Math.round((successfulSearches / totalSearches) * 100) : 0;

  return NextResponse.json({
    users: {
      total: totalUsers,
      newLast30Days: newUsers,
    },
    trips: {
      total: totalTrips,
      newLast30Days: newTrips,
      anonymous: anonTrips,
      authenticated: totalTrips - anonTrips,
    },
    searches: {
      total: totalSearches,
      successful: successfulSearches,
      failed: totalSearches - successfulSearches,
      successRate: searchSuccessRate,
      avgDurationMs: Math.round(avgDuration._avg.durationMs ?? 0),
    },
    topDestinations: topDestinations.map((d) => ({
      iata: d.destination,
      name: d.destinationName,
      count: d._count.id,
    })),
    providers: providerBreakdown.map((p) => ({
      name: p.provider,
      count: p._count.id,
    })),
    serviceTypes: serviceTypeBreakdown.map((s) => ({
      type: s.serviceType,
      count: s._count.id,
    })),
    journal: {
      total: journalCount,
    },
  });
}
