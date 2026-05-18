// /results/flights?tripId=<id>&page=1
// Paginated full flight list fetched from DB cache.

import { Suspense } from "react";
import { PaginatedResultsPage } from "../PaginatedResultsPage";

export const dynamic = "force-dynamic";

export default function FlightsPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-[840px] px-4 sm:px-6 py-6 sm:py-12 text-steel">Loading…</div>}>
      <PaginatedResultsPage serviceType="FLIGHT" title="Flights" />
    </Suspense>
  );
}
