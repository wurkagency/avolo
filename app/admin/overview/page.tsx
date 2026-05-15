import { auth } from "@/lib/server/auth";
import { notFound } from "next/navigation";
import { db } from "@/lib/server/db";
import { StatCard } from "@/components/admin/StatCard";

export const dynamic = "force-dynamic";

export const metadata = { title: "Overview — Admin" };

function formatMs(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export default async function AdminOverviewPage() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "ADMIN") notFound();

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    newUsers,
    totalTrips,
    newTrips,
    anonTrips,
    totalSearches,
    successfulSearches,
    avgDuration,
    topDestinations,
    providerBreakdown,
    serviceTypeBreakdown,
    journalCount,
    recentFailures,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    db.trip.count(),
    db.trip.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    db.trip.count({ where: { userId: null } }),
    db.search.count(),
    db.search.count({ where: { success: true } }),
    db.search.aggregate({ _avg: { durationMs: true } }),
    db.trip.groupBy({
      by: ["destination", "destinationName"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    }),
    db.cachedResult.groupBy({
      by: ["provider"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    }),
    db.cachedResult.groupBy({
      by: ["serviceType"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    }),
    db.journalArticle.count(),
    db.search.findMany({
      where: { success: false },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        trip: { select: { departureName: true, destinationName: true } },
      },
    }),
  ]);

  const searchSuccessRate =
    totalSearches > 0 ? Math.round((successfulSearches / totalSearches) * 100) : 100;

  const avgMs = Math.round(avgDuration._avg.durationMs ?? 0);

  return (
    <div className="flex flex-col gap-10">

      {/* KPI grid */}
      <section>
        <h2 className="text-sm font-semibold text-on-surface-variant uppercase tracking-wide mb-4">
          Platform
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <StatCard label="Total users" value={totalUsers} sub={`+${newUsers} last 30d`} />
          <StatCard label="Total trips" value={totalTrips} sub={`+${newTrips} last 30d`} />
          <StatCard
            label="Anon trips"
            value={anonTrips}
            sub={`${totalTrips > 0 ? Math.round((anonTrips / totalTrips) * 100) : 0}% of all trips`}
          />
          <StatCard
            label="Journal articles"
            value={journalCount}
            sub="published"
          />
        </div>
      </section>

      {/* Search health */}
      <section>
        <h2 className="text-sm font-semibold text-on-surface-variant uppercase tracking-wide mb-4">
          Search health
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Total searches" value={totalSearches} />
          <StatCard
            label="Success rate"
            value={`${searchSuccessRate}%`}
            accent={searchSuccessRate >= 90}
            sub={`${successfulSearches} / ${totalSearches}`}
          />
          <StatCard
            label="Failures"
            value={totalSearches - successfulSearches}
            sub="all time"
          />
          <StatCard
            label="Avg duration"
            value={formatMs(avgMs)}
            sub="per search"
          />
        </div>
      </section>

      {/* Bottom grid: destinations + providers + service types */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* Top destinations */}
        <section className="rounded-2xl border border-outline-variant p-5">
          <h2 className="text-sm font-semibold text-on-surface mb-4">Top destinations</h2>
          {topDestinations.length === 0 ? (
            <p className="text-sm text-on-surface-variant">No data yet</p>
          ) : (
            <ol className="flex flex-col gap-2">
              {topDestinations.map((d, i) => (
                <li key={d.destination} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs text-on-surface-variant w-4 shrink-0">{i + 1}.</span>
                    <span className="text-sm text-on-surface truncate">{d.destinationName}</span>
                    <span className="text-xs text-on-surface-variant shrink-0">({d.destination})</span>
                  </div>
                  <span className="text-sm font-semibold text-primary shrink-0">{d._count.id}</span>
                </li>
              ))}
            </ol>
          )}
        </section>

        {/* Provider usage */}
        <section className="rounded-2xl border border-outline-variant p-5">
          <h2 className="text-sm font-semibold text-on-surface mb-4">Provider usage</h2>
          {providerBreakdown.length === 0 ? (
            <p className="text-sm text-on-surface-variant">No results cached yet</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {providerBreakdown.map((p) => {
                const totalResults = providerBreakdown.reduce((s, x) => s + x._count.id, 0);
                const pct = totalResults > 0 ? Math.round((p._count.id / totalResults) * 100) : 0;
                return (
                  <li key={p.provider}>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-sm text-on-surface capitalize">{p.provider}</span>
                      <span className="text-sm font-semibold text-on-surface">{p._count.id}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-surface-container overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary/60"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Service type breakdown */}
        <section className="rounded-2xl border border-outline-variant p-5">
          <h2 className="text-sm font-semibold text-on-surface mb-4">Results by type</h2>
          {serviceTypeBreakdown.length === 0 ? (
            <p className="text-sm text-on-surface-variant">No results cached yet</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {serviceTypeBreakdown.map((s) => {
                const total = serviceTypeBreakdown.reduce((sum, x) => sum + x._count.id, 0);
                const pct = total > 0 ? Math.round((s._count.id / total) * 100) : 0;
                return (
                  <li key={s.serviceType}>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-sm text-on-surface capitalize">
                        {s.serviceType.charAt(0) + s.serviceType.slice(1).toLowerCase()}
                      </span>
                      <span className="text-sm font-semibold text-on-surface">{s._count.id}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-surface-container overflow-hidden">
                      <div
                        className="h-full rounded-full bg-secondary/60"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {/* Recent failures */}
      {recentFailures.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-on-surface-variant uppercase tracking-wide mb-4">
            Recent search failures
          </h2>
          <div className="rounded-2xl border border-outline-variant overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-container text-left">
                  <th className="px-4 py-3 font-medium text-on-surface-variant">Route</th>
                  <th className="px-4 py-3 font-medium text-on-surface-variant">Duration</th>
                  <th className="px-4 py-3 font-medium text-on-surface-variant">Error</th>
                  <th className="px-4 py-3 font-medium text-on-surface-variant">When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {recentFailures.map((s) => (
                  <tr key={s.id}>
                    <td className="px-4 py-3 text-on-surface">
                      {s.trip.departureName} → {s.trip.destinationName}
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant">{formatMs(s.durationMs)}</td>
                    <td className="px-4 py-3 text-red-600 max-w-xs truncate">
                      {s.errorLog
                        ? JSON.stringify(s.errorLog).slice(0, 80)
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant whitespace-nowrap">
                      {new Intl.DateTimeFormat("en", { dateStyle: "short", timeStyle: "short" }).format(
                        new Date(s.createdAt),
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
