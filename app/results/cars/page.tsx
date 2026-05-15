import { Suspense } from "react";
import { PaginatedResultsPage } from "../PaginatedResultsPage";

export const dynamic = "force-dynamic";

export default function CarsPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-5xl px-4 py-12 text-on-surface-variant">Loading…</div>}>
      <PaginatedResultsPage serviceType="CAR" title="Car rentals" />
    </Suspense>
  );
}
