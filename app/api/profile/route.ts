// GET  /api/profile        — returns authenticated user's profile
// PATCH /api/profile       — update name, currency, language
// DELETE /api/profile      — GDPR hard-delete with email confirmation

import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import type { Currency, Language } from "@prisma/client";

const VALID_CURRENCIES: Currency[] = ["EUR", "USD", "GBP", "DKK", "SEK", "NOK"];
const VALID_LANGUAGES: Language[] = ["EN", "DE", "DA", "SV", "NO"];

// ── GET ────────────────────────────────────────────────────────────────────

export async function GET(): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, name: true, currency: true, language: true, createdAt: true },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  return NextResponse.json(user);
}

// ── PATCH ──────────────────────────────────────────────────────────────────

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const updates: { name?: string; currency?: Currency; language?: Language } = {};

  if ("name" in body) {
    if (typeof body.name !== "string" || body.name.trim().length < 1) {
      return NextResponse.json({ error: "name must be a non-empty string" }, { status: 400 });
    }
    updates.name = body.name.trim().slice(0, 100);
  }

  if ("currency" in body) {
    if (!VALID_CURRENCIES.includes(body.currency as Currency)) {
      return NextResponse.json({ error: `currency must be one of: ${VALID_CURRENCIES.join(", ")}` }, { status: 400 });
    }
    updates.currency = body.currency as Currency;
  }

  if ("language" in body) {
    if (!VALID_LANGUAGES.includes(body.language as Language)) {
      return NextResponse.json({ error: `language must be one of: ${VALID_LANGUAGES.join(", ")}` }, { status: 400 });
    }
    updates.language = body.language as Language;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const updated = await db.user.update({
    where: { id: session.user.id },
    data: updates,
    select: { id: true, email: true, name: true, currency: true, language: true },
  });

  return NextResponse.json(updated);
}

// ── DELETE ─────────────────────────────────────────────────────────────────

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const confirmedEmail = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { email: true },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (confirmedEmail !== user.email.toLowerCase()) {
    return NextResponse.json({ error: "Email does not match — account not deleted" }, { status: 400 });
  }

  // Delete trips first (no Prisma cascade on User→Trip relation)
  await db.trip.deleteMany({ where: { userId: session.user.id } });
  // Delete user — cascades to Account, Session, Preferences, NotificationSettings
  await db.user.delete({ where: { id: session.user.id } });

  return NextResponse.json({ success: true });
}
