"use client";

import Link from "next/link";

interface AllProvidersFailedModalProps {
  destination: string;
}

export function AllProvidersFailedModal({ destination }: AllProvidersFailedModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-canvas rounded-lg border border-hairline shadow-xl w-full max-w-md p-8 flex flex-col gap-6">
        {/* Icon */}
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-50 mx-auto">
          <span className="material-symbols-outlined text-amber-600 text-2xl">
            cloud_off
          </span>
        </div>

        {/* Copy */}
        <div className="text-center flex flex-col gap-2">
          <h2
            className="text-ink font-semibold"
            style={{ fontFamily: "var(--font-editorial)", fontSize: "22px", fontWeight: 500 }}
          >
            No live data available
          </h2>
          <p className="text-steel text-sm leading-relaxed">
            We couldn&apos;t retrieve real results for{destination ? ` ${destination}` : " this search"} right now.
            All travel data providers are currently unreachable — this is a temporary issue on our end.
          </p>
          <p className="text-steel text-sm leading-relaxed">
            Rather than show you estimated prices, we&apos;ve paused this search. Please try again in a few minutes.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="w-full rounded-md bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
          >
            Try again
          </button>
          <Link
            href="/explore"
            className="w-full rounded-md border border-hairline px-4 py-3 text-sm font-medium text-ink text-center hover:bg-surface transition-colors"
          >
            Edit search
          </Link>
        </div>
      </div>
    </div>
  );
}
