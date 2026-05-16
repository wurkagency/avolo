"use client";

import { useState, useEffect, useCallback } from "react";

interface UserRow {
  id: string;
  email: string;
  name: string | null;
  role: "USER" | "ADMIN";
  currency: string;
  language: string;
  createdAt: string;
  tripCount: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminUsersPage() {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState<"all" | "USER" | "ADMIN">("all");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (p: number, r: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: "20" });
      if (r !== "all") params.set("role", r);
      const res = await fetch(`/api/admin/users?${params.toString()}`);
      if (!res.ok) return;
      const data = await res.json() as { users: UserRow[]; pagination: Pagination };
      setRows(data.users);
      setPagination(data.pagination);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(page, roleFilter);
  }, [load, page, roleFilter]);

  function handleRoleChange(r: "all" | "USER" | "ADMIN") {
    setRoleFilter(r);
    setPage(1);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-lg font-semibold text-ink">
          Users
          {pagination && (
            <span className="ml-2 text-sm font-normal text-steel">
              ({pagination.total} total)
            </span>
          )}
        </h2>
        <div className="flex gap-1 rounded-xl border border-hairline overflow-hidden text-sm">
          {(["all", "USER", "ADMIN"] as const).map((r) => (
            <button
              key={r}
              onClick={() => handleRoleChange(r)}
              className={`px-4 py-2 font-medium transition-colors ${
                roleFilter === r
                  ? "bg-primary text-white"
                  : "text-steel hover:bg-surface"
              }`}
            >
              {r === "all" ? "All" : r}
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
        <p className="text-sm text-steel py-8">No users found.</p>
      ) : (
        <>
          <div className="rounded-lg border border-hairline overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="bg-surface text-left border-b border-hairline">
                  <th className="px-4 py-3 font-medium text-steel">User</th>
                  <th className="px-4 py-3 font-medium text-steel">Role</th>
                  <th className="px-4 py-3 font-medium text-steel">Currency</th>
                  <th className="px-4 py-3 font-medium text-steel">Trips</th>
                  <th className="px-4 py-3 font-medium text-steel">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {rows.map((u) => (
                  <tr key={u.id} className="hover:bg-surface/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink">{u.name ?? "—"}</p>
                      <p className="text-xs text-steel mt-0.5">{u.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          u.role === "ADMIN"
                            ? "bg-primary/10 text-primary"
                            : "bg-surface text-steel"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-steel">{u.currency}</td>
                    <td className="px-4 py-3 text-ink tabular-nums font-medium">
                      {u.tripCount}
                    </td>
                    <td className="px-4 py-3 text-steel whitespace-nowrap tabular-nums">
                      {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(
                        new Date(u.createdAt),
                      )}
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
