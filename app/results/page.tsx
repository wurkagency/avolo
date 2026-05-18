// /results?tripId=<id>
// Reads tripId from URL, opens SSE stream, renders results as they arrive.

import { Suspense } from "react";
import { ResultsPageInner } from "./ResultsPageInner";

export const dynamic = "force-dynamic";

export default function ResultsPage() {
  return (
    <Suspense fallback={<ResultsLoadingFallback />}>
      <ResultsPageInner />
    </Suspense>
  );
}

function ResultsLoadingFallback() {
  return (
    <main className="mx-auto max-w-[840px] px-4 sm:px-6 py-6 sm:py-12">
      <div className="flex items-center gap-3 text-steel">
        <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span>Loading…</span>
      </div>
    </main>
  );
}
