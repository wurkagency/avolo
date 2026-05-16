"use client";

import { cn } from "@/lib/utils/cn";

interface SSEStatusProps {
  status: string;
  isDone: boolean;
  error: string | null;
}

export function SSEStatus({ status, isDone, error }: SSEStatusProps) {
  if (isDone && !error) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg px-5 py-4 text-sm font-medium",
        error
          ? "bg-red-50 text-red-700"
          : "bg-primary/5 text-primary",
      )}
      role="status"
      aria-live="polite"
    >
      {!isDone && !error && (
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      )}
      <span>{error ?? status}</span>
    </div>
  );
}
