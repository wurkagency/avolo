// /results/flights?tripId=<id>&page=1
// Paginated full flight list fetched from DB cache.

import { Suspense } from "react";
import { PaginatedResultsPage } from "../PaginatedResultsPage";

export const dynamic = "force-dynamic";

export default function FlightsPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-5xl px-4 py-12 text-steel">Loading…</div>}>
      <PaginatedResultsPage serviceType="FLIGHT" title="Flights" />
    </Suspense>
  );
}
