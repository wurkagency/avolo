import { Suspense } from "react";
import { PaginatedResultsPage } from "../PaginatedResultsPage";

export const dynamic = "force-dynamic";

export default function HotelsPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-[840px] px-4 sm:px-6 py-6 sm:py-12 text-steel">Loading…</div>}>
      <PaginatedResultsPage serviceType="HOTEL" title="Hotels" />
    </Suspense>
  );
}
