// Trip CRUD — creates, reads, updates trips.
// Handles both authenticated (userId) and anonymous (anonId) sessions.
// Lazily creates AnonymousSession DB record on first trip write.

import { Prisma, type Trip } from "@prisma/client";
import { db } from "@/lib/server/db";
import type { SearchRequest } from "@/types/search";

// ─── Create trip ───────────────────────────────────────────────────────────

export async function createTrip(
  req: SearchRequest,
  opts: { userId?: string; anonId?: string },
): Promise<Trip> {
  if (!opts.userId && !opts.anonId) {
    throw new Error("createTrip requires either userId or anonId");
  }

  // Lazy-create AnonymousSession record on first trip write
  if (opts.anonId && !opts.userId) {
    await db.anonymousSession.upsert({
      where: { id: opts.anonId },
      update: {},
      create: {
        id: opts.anonId,
        expiresAt: new Date(Date.now() + 30 * 24 * 3_600_000),
      },
    });
  }

  const trip = await db.trip.create({
    data: {
      userId: opts.userId ?? null,
      anonymousSessionId: opts.userId ? null : (opts.anonId ?? null),
      departure: req.departure,
      destination: req.destination,
      departureName: req.departureName,
      destinationName: req.destinationName,
      departureDate: new Date(req.departureDate),
      returnDate: req.returnDate ? new Date(req.returnDate) : null,
      isOneWay: req.isOneWay,
      flexibility: req.flexibility,
      adults: req.adults,
      children: req.children as unknown as Prisma.InputJsonValue,
      hasDisability: req.hasDisability,
      handLuggage: req.handLuggage,
      checkedLuggage: req.checkedLuggage,
      specialLuggage: req.specialLuggage,
      status: "DRAFT",
      services: {
        create: req.services.map((type) => ({ type })),
      },
    },
    include: { services: true },
  });

  return trip;
}

// ─── Get trip with ownership check ────────────────────────────────────────

export async function getTripForSession(
  tripId: string,
  opts: { userId?: string; anonId?: string },
): Promise<Trip | null> {
  const trip = await db.trip.findUnique({
    where: { id: tripId },
    include: { services: true },
  });

  if (!trip) return null;

  // Verify ownership
  const ownedByUser = opts.userId && trip.userId === opts.userId;
  const ownedByAnon = opts.anonId && trip.anonymousSessionId === opts.anonId;

  if (!ownedByUser && !ownedByAnon) return null;

  return trip;
}

// ─── Get services for a trip ───────────────────────────────────────────────

export async function getTripServices(tripId: string): Promise<string[]> {
  const services = await db.tripService.findMany({
    where: { tripId },
    select: { type: true },
  });
  return services.map((s) => s.type);
}

// ─── Mark trip as searching ────────────────────────────────────────────────

export async function markTripSearching(tripId: string): Promise<void> {
  await db.trip.update({
    where: { id: tripId },
    data: { status: "SEARCHING" },
  });
}

// ─── Get cached results for a trip ────────────────────────────────────────

export async function getCachedResults(
  tripId: string,
  serviceType?: string,
  page = 1,
  limit = 20,
) {
  const where = {
    tripId,
    ...(serviceType ? { serviceType: serviceType as "FLIGHT" | "HOTEL" | "CAR" | "EXCURSION" } : {}),
    expiresAt: { gt: new Date() },
  };
  const [total, rows] = await Promise.all([
    db.cachedResult.count({ where }),
    db.cachedResult.findMany({
      where,
      orderBy: { rank: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);
  return { rows, total };
}

// ─── List trips for a session (auth or anon) ───────────────────────────────

export async function getUserTrips(opts: { userId?: string; anonId?: string }) {
  if (!opts.userId && !opts.anonId) return [];

  return db.trip.findMany({
    where: {
      ...(opts.userId
        ? { userId: opts.userId }
        : { anonymousSessionId: opts.anonId }),
    },
    include: { services: { select: { type: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

// ─── Get a single trip (with services) ────────────────────────────────────

export async function getTripById(
  tripId: string,
  opts: { userId?: string; anonId?: string },
) {
  const trip = await db.trip.findUnique({
    where: { id: tripId },
    include: { services: { select: { type: true } } },
  });

  if (!trip) return null;

  const ownedByUser = opts.userId && trip.userId === opts.userId;
  const ownedByAnon = opts.anonId && trip.anonymousSessionId === opts.anonId;
  if (!ownedByUser && !ownedByAnon) return null;

  return trip;
}

// ─── Delete a trip ─────────────────────────────────────────────────────────

export async function deleteTrip(
  tripId: string,
  opts: { userId?: string; anonId?: string },
): Promise<boolean> {
  const trip = await getTripById(tripId, opts);
  if (!trip) return false;

  await db.trip.delete({ where: { id: tripId } });
  return true;
}

// ─── Delete old cached results before refresh ──────────────────────────────

export async function clearCachedResults(tripId: string): Promise<void> {
  await db.cachedResult.deleteMany({ where: { tripId } });
}
