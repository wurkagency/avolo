import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import type { NormalizedResult } from "@/types/search";

const VALID_TYPES = ["FLIGHT", "HOTEL", "CAR", "EXCURSION"] as const;
type ValidType = (typeof VALID_TYPES)[number];

export async function GET(
  req: Request,
  { params }: { params: { type: string; id: string } },
) {
  const { searchParams } = new URL(req.url);
  const tripId = searchParams.get("tripId");
  const serviceType = params.type.toUpperCase() as ValidType;

  if (!tripId) return NextResponse.json({ error: "tripId required" }, { status: 400 });
  if (!VALID_TYPES.includes(serviceType)) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  const rows = await db.cachedResult.findMany({
    where: { tripId, serviceType, expiresAt: { gt: new Date() } },
  });

  const resultId = decodeURIComponent(params.id);
  const row = rows.find((r) => {
    const nd = r.normalizedData as unknown as NormalizedResult;
    return nd.id === resultId;
  });

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ result: row.normalizedData as unknown as NormalizedResult });
}
