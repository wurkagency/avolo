// GET  /api/trips/[id]  — fetch single trip (ownership-checked)
// DELETE /api/trips/[id] — remove trip and all cascade data

import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/server/auth";
import { getTripById, deleteTrip } from "@/server/services/tripService";

type Params = { params: { id: string } };

export async function GET(request: NextRequest, { params }: Params): Promise<NextResponse> {
  const session = await auth();
  const userId = session?.user?.id;
  const anonId = request.cookies.get("avolo_sid")?.value;

  if (!userId && !anonId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const trip = await getTripById(params.id, { userId, anonId });
  if (!trip) return NextResponse.json({ error: "Trip not found" }, { status: 404 });

  return NextResponse.json({
    id: trip.id,
    departure: trip.departure,
    departureName: trip.departureName,
    destination: trip.destination,
    destinationName: trip.destinationName,
    departureDate: trip.departureDate.toISOString().slice(0, 10),
    returnDate: trip.returnDate ? trip.returnDate.toISOString().slice(0, 10) : null,
    isOneWay: trip.isOneWay,
    flexibility: trip.flexibility,
    adults: trip.adults,
    children: trip.children,
    hasDisability: trip.hasDisability,
    handLuggage: trip.handLuggage,
    checkedLuggage: trip.checkedLuggage,
    specialLuggage: trip.specialLuggage,
    status: trip.status,
    totalPriceEur: trip.totalPriceEur,
    lastRefreshedAt: trip.lastRefreshedAt?.toISOString() ?? null,
    createdAt: trip.createdAt.toISOString(),
    services: trip.services.map((s) => s.type),
  });
}

export async function DELETE(request: NextRequest, { params }: Params): Promise<NextResponse> {
  const session = await auth();
  const userId = session?.user?.id;
  const anonId = request.cookies.get("avolo_sid")?.value;

  if (!userId && !anonId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const deleted = await deleteTrip(params.id, { userId, anonId });
  if (!deleted) return NextResponse.json({ error: "Trip not found" }, { status: 404 });

  return NextResponse.json({ success: true });
}
