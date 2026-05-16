import { Suspense } from "react";
import { PaginatedResultsPage } from "../PaginatedResultsPage";

export const dynamic = "force-dynamic";

export default function HotelsPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-5xl px-4 py-12 text-steel">Loading…</div>}>
      <PaginatedResultsPage serviceType="HOTEL" title="Hotels" />
    </Suspense>
  );
}
