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
    <main className="mx-auto max-w-5xl px-4 py-12">
      <div className="flex items-center gap-3 text-on-surface-variant">
        <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span>Loading…</span>
      </div>
    </main>
  );
}
