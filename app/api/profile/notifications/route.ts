// GET  /api/profile/notifications  — returns notification settings
// PATCH /api/profile/notifications — update toggles

import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/server/auth";
import { db } from "@/lib/server/db";

// ── GET ────────────────────────────────────────────────────────────────────

export async function GET(): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const settings = await db.notificationSettings.findUnique({
    where: { userId: session.user.id },
  });

  // Defaults if row missing (shouldn't happen — created in auth createUser event)
  return NextResponse.json(settings ?? {
    priceDropAlerts: true,
    tripUpdates: true,
    systemEmails: true,
  });
}

// ── PATCH ──────────────────────────────────────────────────────────────────

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const updates: { priceDropAlerts?: boolean; tripUpdates?: boolean; systemEmails?: boolean } = {};

  if ("priceDropAlerts" in body && typeof body.priceDropAlerts === "boolean") {
    updates.priceDropAlerts = body.priceDropAlerts;
  }
  if ("tripUpdates" in body && typeof body.tripUpdates === "boolean") {
    updates.tripUpdates = body.tripUpdates;
  }
  if ("systemEmails" in body && typeof body.systemEmails === "boolean") {
    updates.systemEmails = body.systemEmails;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid boolean fields provided" }, { status: 400 });
  }

  const settings = await db.notificationSettings.upsert({
    where: { userId: session.user.id },
    update: updates,
    create: { userId: session.user.id, ...updates },
  });

  return NextResponse.json(settings);
}
