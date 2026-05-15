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
        <h2 className="text-lg font-semibold text-on-surface">
          Users
          {pagination && (
            <span className="ml-2 text-sm font-normal text-on-surface-variant">
              ({pagination.total} total)
            </span>
          )}
        </h2>
        <div className="flex gap-1 rounded-xl border border-outline-variant overflow-hidden text-sm">
          {(["all", "USER", "ADMIN"] as const).map((r) => (
            <button
              key={r}
              onClick={() => handleRoleChange(r)}
              className={`px-4 py-2 font-medium transition-colors ${
                roleFilter === r
                  ? "bg-primary text-white"
                  : "text-on-surface-variant hover:bg-surface-container"
              }`}
            >
              {r === "all" ? "All" : r}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 py-12 text-on-surface-variant">
          <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span>Loading…</span>
        </div>
      ) : rows.length === 0 ? (
        <p className="text-sm text-on-surface-variant py-8">No users found.</p>
      ) : (
        <>
          <div className="rounded-2xl border border-outline-variant overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="bg-surface-container text-left border-b border-outline-variant">
                  <th className="px-4 py-3 font-medium text-on-surface-variant">User</th>
                  <th className="px-4 py-3 font-medium text-on-surface-variant">Role</th>
                  <th className="px-4 py-3 font-medium text-on-surface-variant">Currency</th>
                  <th className="px-4 py-3 font-medium text-on-surface-variant">Trips</th>
                  <th className="px-4 py-3 font-medium text-on-surface-variant">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {rows.map((u) => (
                  <tr key={u.id} className="hover:bg-surface-container/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-on-surface">{u.name ?? "—"}</p>
                      <p className="text-xs text-on-surface-variant mt-0.5">{u.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          u.role === "ADMIN"
                            ? "bg-primary/10 text-primary"
                            : "bg-surface-container text-on-surface-variant"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant">{u.currency}</td>
                    <td className="px-4 py-3 text-on-surface tabular-nums font-medium">
                      {u.tripCount}
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant whitespace-nowrap tabular-nums">
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
              <p className="text-sm text-on-surface-variant">
                {pagination.total} total · page {pagination.page} of {pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page <= 1}
                  className="rounded-xl border border-outline-variant px-4 py-2 text-sm font-medium text-on-surface disabled:opacity-40 hover:bg-surface-container transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= pagination.totalPages}
                  className="rounded-xl border border-outline-variant px-4 py-2 text-sm font-medium text-on-surface disabled:opacity-40 hover:bg-surface-container transition-colors"
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
