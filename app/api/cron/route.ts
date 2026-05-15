// POST /api/cron — scheduled maintenance tasks
// Called by Plesk cron or external cron service.
// Secured by CRON_SECRET header; reject without it.

import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/server/db";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const secret = request.headers.get("x-cron-secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const staleThreshold = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [deletedSessions, stalledTrips] = await Promise.all([
    // Delete expired anonymous sessions (cascade removes their orphaned trips)
    db.anonymousSession.deleteMany({
      where: { expiresAt: { lt: now } },
    }),

    // Mark complete trips stale if not refreshed in 24h
    db.trip.updateMany({
      where: {
        status: "COMPLETE",
        lastRefreshedAt: { lt: staleThreshold },
      },
      data: { status: "STALE" },
    }),
  ]);

  console.log(
    `[cron] Deleted ${deletedSessions.count} expired anon sessions. Marked ${stalledTrips.count} trips as STALE.`,
  );

  return NextResponse.json({
    ok: true,
    deletedSessions: deletedSessions.count,
    markedStale: stalledTrips.count,
    ranAt: now.toISOString(),
  });
}
