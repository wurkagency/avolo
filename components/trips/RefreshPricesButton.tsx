"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUiStore } from "@/lib/state/uiStore";

interface RefreshPricesButtonProps {
  tripId: string;
  /** Called after successful refresh so parent can update its display data */
  onRefreshed?: () => void;
  variant?: "card" | "detail";
}

export function RefreshPricesButton({ tripId, onRefreshed, variant = "card" }: RefreshPricesButtonProps) {
  const [loading, setLoading] = useState(false);
  const addToast = useUiStore((s) => s.addToast);
  const router = useRouter();

  async function handleRefresh() {
    if (loading) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/trips/${encodeURIComponent(tripId)}/refresh`, {
        method: "POST",
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: "Refresh failed" })) as { error?: string };
        throw new Error(body.error ?? "Refresh failed");
      }

      addToast("Prices refreshed", "success");
      onRefreshed?.();
      // Refresh server component data if this is a server-rendered detail page
      router.refresh();
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Refresh failed", "error");
    } finally {
      setLoading(false);
    }
  }

  if (variant === "detail") {
    return (
      <button
        onClick={handleRefresh}
        disabled={loading}
        className="flex items-center gap-2 rounded-full border border-outline-variant px-5 py-2 text-sm font-medium text-on-surface hover:bg-surface-container transition-colors disabled:opacity-50"
        aria-label="Refresh prices"
      >
        <span
          className={`material-symbols-outlined text-base ${loading ? "animate-spin" : ""}`}
          aria-hidden="true"
        >
          refresh
        </span>
        {loading ? "Refreshing…" : "Refresh prices"}
      </button>
    );
  }

  return (
    <button
      onClick={handleRefresh}
      disabled={loading}
      className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline disabled:opacity-50 disabled:no-underline transition-opacity"
      aria-label="Refresh prices for this trip"
    >
      <span
        className={`material-symbols-outlined text-[14px] ${loading ? "animate-spin" : ""}`}
        aria-hidden="true"
      >
        refresh
      </span>
      {loading ? "Refreshing…" : "Refresh prices"}
    </button>
  );
}
