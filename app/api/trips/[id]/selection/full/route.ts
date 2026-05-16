import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import type { NormalizedResult } from "@/types/search";
import type { ServiceType } from "@/types/trip";

async function findResult(tripId: string, resultId: string, serviceType: ServiceType): Promise<NormalizedResult | null> {
  const rows = await db.cachedResult.findMany({
    where: { tripId, serviceType, expiresAt: { gt: new Date() } },
    select: { normalizedData: true },
  });
  const row = rows.find((r) => {
    const nd = r.normalizedData as unknown as NormalizedResult;
    return nd.id === resultId;
  });
  return row ? (row.normalizedData as unknown as NormalizedResult) : null;
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const selection = await db.tripSelection.findUnique({ where: { tripId: params.id } });
  if (!selection) return NextResponse.json({ selection: null, results: {} });

  const pairs: Array<[string | null, ServiceType]> = [
    [selection.flightResultId, "FLIGHT"],
    [selection.hotelResultId, "HOTEL"],
    [selection.carResultId, "CAR"],
    [selection.excursionResultId, "EXCURSION"],
  ];

  const resolved = await Promise.all(
    pairs.map(async ([id, type]) => {
      if (!id) return [type, null] as [ServiceType, NormalizedResult | null];
      const result = await findResult(params.id, id, type);
      return [type, result] as [ServiceType, NormalizedResult | null];
    }),
  );

  const results: Partial<Record<ServiceType, NormalizedResult>> = {};
  for (const [type, result] of resolved) {
    if (result) results[type] = result;
  }

  return NextResponse.json({
    selection: {
      totalPriceEur: selection.totalPriceEur,
      flightResultId: selection.flightResultId,
      hotelResultId: selection.hotelResultId,
      carResultId: selection.carResultId,
      excursionResultId: selection.excursionResultId,
    },
    results,
  });
}
