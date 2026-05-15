// POST /api/profile/export
// GDPR data export — returns all user data as a JSON file download.

import { NextResponse } from "next/server";
import { auth } from "@/lib/server/auth";
import { db } from "@/lib/server/db";

export async function POST(): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

  const [user, preferences, notifications, trips, searches] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, currency: true, language: true, createdAt: true, updatedAt: true },
    }),
    db.preferences.findUnique({ where: { userId } }),
    db.notificationSettings.findUnique({ where: { userId } }),
    db.trip.findMany({
      where: { userId },
      include: { services: true },
      orderBy: { createdAt: "desc" },
    }),
    db.search.findMany({
      where: { trip: { userId } },
      orderBy: { createdAt: "desc" },
      take: 500,
    }),
  ]);

  const exportData = {
    exportedAt: new Date().toISOString(),
    user,
    preferences,
    notifications,
    trips: trips.map((t) => ({
      id: t.id,
      departure: t.departureName,
      destination: t.destinationName,
      departureDate: t.departureDate,
      returnDate: t.returnDate,
      isOneWay: t.isOneWay,
      adults: t.adults,
      status: t.status,
      totalPriceEur: t.totalPriceEur,
      createdAt: t.createdAt,
      services: t.services.map((s) => s.type),
    })),
    searchHistory: searches.map((s) => ({
      tripId: s.tripId,
      durationMs: s.durationMs,
      success: s.success,
      createdAt: s.createdAt,
    })),
  };

  const json = JSON.stringify(exportData, null, 2);
  const filename = `avolo-export-${new Date().toISOString().slice(0, 10)}.json`;

  return new NextResponse(json, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
