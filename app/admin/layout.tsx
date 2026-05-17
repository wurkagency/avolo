// Admin section layout — enforced by middleware (ADMIN role only)
// Double-checks role here as defense in depth against middleware bypasses.

import type { ReactNode } from "react";
import Link from "next/link";
import { auth } from "@/lib/server/auth";
import { notFound } from "next/navigation";
import { AdminNav } from "@/components/admin/AdminNav";
import { SunsetStripeBand } from "@/components/ui/SunsetStripeBand";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "ADMIN") notFound();

  return (
    <div className="flex flex-col min-h-dvh">
      <div className="flex-1 mx-auto max-w-6xl px-4 py-10 sm:px-6 w-full">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1
              className="text-2xl font-bold text-ink"
              style={{ fontFamily: "var(--font-editorial)" }}
            >
              Admin
            </h1>
            <p className="text-sm text-steel mt-0.5">Platform metrics and management</p>
          </div>
          <Link
            href="/"
            className="text-xs font-medium text-steel hover:text-ink transition-colors uppercase tracking-wide"
          >
            ← Back to app
          </Link>
        </div>

        <AdminNav />

        {children}
      </div>
      <SunsetStripeBand />
    </div>
  );
}
