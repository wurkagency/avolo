import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const selection = await db.tripSelection.findUnique({ where: { tripId: params.id } });
  if (!selection) return NextResponse.json({ selection: null });
  return NextResponse.json({ selection });
}

interface SelectionBody {
  type: "FLIGHT" | "HOTEL" | "CAR" | "EXCURSION";
  resultId: string | null;
  priceEur: number | null;
  summary: string | null;
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const body = await req.json() as SelectionBody;
  const { type, resultId, priceEur, summary } = body;

  if (!["FLIGHT", "HOTEL", "CAR", "EXCURSION"].includes(type)) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  const fieldMap: Record<string, string> = {
    FLIGHT: "flight",
    HOTEL: "hotel",
    CAR: "car",
    EXCURSION: "excursion",
  };
  const prefix = fieldMap[type];

  const existing = await db.tripSelection.findUnique({ where: { tripId: params.id } });

  const updateData = {
    [`${prefix}ResultId`]: resultId,
    [`${prefix}PriceEur`]: priceEur,
    [`${prefix}Summary`]: summary,
  };

  let updated;
  if (existing) {
    updated = await db.tripSelection.update({
      where: { tripId: params.id },
      data: updateData,
    });
  } else {
    updated = await db.tripSelection.create({
      data: { tripId: params.id, ...updateData },
    });
  }

  const total =
    (updated.flightPriceEur ?? 0) +
    (updated.hotelPriceEur ?? 0) +
    (updated.carPriceEur ?? 0) +
    (updated.excursionPriceEur ?? 0);

  await db.tripSelection.update({
    where: { id: updated.id },
    data: { totalPriceEur: total > 0 ? total : null },
  });

  return NextResponse.json({ ok: true });
}
