"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface SearchRow {
  id: string;
  tripId: string;
  departureName: string;
  destinationName: string;
  providers: unknown;
  durationMs: number;
  success: boolean;
  errorLog: unknown;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

function formatMs(ms: number) {
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
}

export default function AdminSearchesPage() {
  const [rows, setRows] = useState<SearchRow[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<"all" | "true" | "false">("all");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (p: number, f: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: "20" });
      if (f !== "all") params.set("success", f);
      const res = await fetch(`/api/admin/searches?${params.toString()}`);
      if (!res.ok) return;
      const data = await res.json() as { searches: SearchRow[]; pagination: Pagination };
      setRows(data.searches);
      setPagination(data.pagination);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(page, filter);
  }, [load, page, filter]);

  function handleFilterChange(f: "all" | "true" | "false") {
    setFilter(f);
    setPage(1);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-lg font-semibold text-ink">Search log</h2>
        <div className="flex gap-1 rounded-xl border border-hairline overflow-hidden text-sm">
          {(["all", "true", "false"] as const).map((f) => (
            <button
              key={f}
              onClick={() => handleFilterChange(f)}
              className={`px-4 py-2 font-medium transition-colors ${
                filter === f
                  ? "bg-primary text-white"
                  : "text-steel hover:bg-surface"
              }`}
            >
              {f === "all" ? "All" : f === "true" ? "Success" : "Failed"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 py-12 text-steel">
          <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span>Loading…</span>
        </div>
      ) : rows.length === 0 ? (
        <p className="text-sm text-steel py-8">No searches found.</p>
      ) : (
        <>
          <div className="rounded-lg border border-hairline overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="bg-surface text-left border-b border-hairline">
                  <th className="px-4 py-3 font-medium text-steel">Route</th>
                  <th className="px-4 py-3 font-medium text-steel">Status</th>
                  <th className="px-4 py-3 font-medium text-steel">Duration</th>
                  <th className="px-4 py-3 font-medium text-steel">Providers</th>
                  <th className="px-4 py-3 font-medium text-steel">Error</th>
                  <th className="px-4 py-3 font-medium text-steel">When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {rows.map((s) => (
                  <tr key={s.id} className="hover:bg-surface/50 transition-colors">
                    <td className="px-4 py-3">
                      <Link
                        href={`/trip/${s.tripId}`}
                        className="text-primary hover:underline"
                      >
                        {s.departureName} → {s.destinationName}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          s.success
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {s.success ? "OK" : "FAIL"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-steel tabular-nums">
                      {formatMs(s.durationMs)}
                    </td>
                    <td className="px-4 py-3 text-steel max-w-[160px] truncate">
                      {Array.isArray(s.providers)
                        ? (s.providers as string[]).join(", ")
                        : typeof s.providers === "string"
                          ? s.providers
                          : JSON.stringify(s.providers)}
                    </td>
                    <td className="px-4 py-3 text-red-600 max-w-[200px] truncate">
                      {s.errorLog ? JSON.stringify(s.errorLog).slice(0, 60) : "—"}
                    </td>
                    <td className="px-4 py-3 text-steel whitespace-nowrap tabular-nums">
                      {new Intl.DateTimeFormat("en", {
                        dateStyle: "short",
                        timeStyle: "short",
                      }).format(new Date(s.createdAt))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-steel">
                {pagination.total} total · page {pagination.page} of {pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page <= 1}
                  className="rounded-xl border border-hairline px-4 py-2 text-sm font-medium text-ink disabled:opacity-40 hover:bg-surface transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= pagination.totalPages}
                  className="rounded-xl border border-hairline px-4 py-2 text-sm font-medium text-ink disabled:opacity-40 hover:bg-surface transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
