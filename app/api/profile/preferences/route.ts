// GET  /api/profile/preferences  — returns user's travel preferences
// PATCH /api/profile/preferences — upsert (auto-create if new user has no row)

import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import type { Prisma } from "@prisma/client";

// ── GET ────────────────────────────────────────────────────────────────────

export async function GET(): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const prefs = await db.preferences.findUnique({ where: { userId: session.user.id } });

  if (!prefs) {
    return NextResponse.json({
      preferredAirports: [],
      maxStops: 2,
      travelType: "any",
      cabin: "economy",
      preferredAirlines: [],
      flightStyle: "cheapest",
      hotelType: "any",
      hotelLocation: "any",
      carType: "economy",
      carInsurance: "basic",
      carPickupType: "any",
      excursionStyle: [],
      excursionBudget: "medium",
    });
  }

  return NextResponse.json(prefs);
}

// ── PATCH ──────────────────────────────────────────────────────────────────

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  // Only accept known fields
  const allowed = [
    "maxStops", "travelType", "cabin", "flightStyle",
    "hotelType", "hotelLocation",
    "carType", "carInsurance", "carPickupType",
    "excursionBudget",
    "preferredAirports", "preferredAirlines", "excursionStyle",
  ];

  const data: Record<string, unknown> = {};
  for (const key of allowed) {
    if (!(key in body)) continue;
    if (key === "maxStops") {
      const v = body[key];
      if (typeof v !== "number" || !Number.isInteger(v) || v < 0 || v > 10) {
        return NextResponse.json({ error: "maxStops must be an integer 0–10" }, { status: 400 });
      }
    }
    data[key] = body[key];
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });
  }

  const prefs = await db.preferences.upsert({
    where: { userId: session.user.id },
    update: data as Prisma.PreferencesUpdateInput,
    create: {
      userId: session.user.id,
      preferredAirports: (data.preferredAirports as Prisma.InputJsonValue | undefined) ?? [],
      preferredAirlines: (data.preferredAirlines as Prisma.InputJsonValue | undefined) ?? [],
      excursionStyle: (data.excursionStyle as Prisma.InputJsonValue | undefined) ?? [],
      maxStops: typeof data.maxStops === "number" ? data.maxStops : 2,
      travelType: typeof data.travelType === "string" ? data.travelType : "any",
      cabin: typeof data.cabin === "string" ? data.cabin : "economy",
      flightStyle: typeof data.flightStyle === "string" ? data.flightStyle : "cheapest",
      hotelType: typeof data.hotelType === "string" ? data.hotelType : "any",
      hotelLocation: typeof data.hotelLocation === "string" ? data.hotelLocation : "any",
      carType: typeof data.carType === "string" ? data.carType : "economy",
      carInsurance: typeof data.carInsurance === "string" ? data.carInsurance : "basic",
      carPickupType: typeof data.carPickupType === "string" ? data.carPickupType : "any",
      excursionBudget: typeof data.excursionBudget === "string" ? data.excursionBudget : "medium",
    },
  });

  return NextResponse.json(prefs);
}
