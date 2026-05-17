"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils/cn";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}

// All classes use the project token palette from tailwind.config.ts / tokens.css.
// No Tailwind defaults (green-*, amber-*) — only design-system tokens.
const typeClasses: Record<ToastType, string> = {
  success: "bg-cream-light  border-primary      text-primary-deep",
  error:   "bg-error-container border-error     text-on-error-container",
  info:    "bg-surface      border-hairline-strong text-steel",
  warning: "bg-cream-deeper border-sunshine-700 text-ink",
};

const icons: Record<ToastType, string> = {
  success: "check_circle",
  error:   "error",
  info:    "info",
  warning: "warning",
};

export function Toast({ toast, onDismiss }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 5000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-3 w-full max-w-sm px-4 py-3 border rounded-xl shadow-md anim-toast",
        typeClasses[toast.type],
      )}
    >
      <span
        className="material-symbols-outlined text-[20px] shrink-0 mt-0.5"
        aria-hidden="true"
      >
        {icons[toast.type]}
      </span>
      <p
        className="flex-1"
        style={{ fontFamily: "var(--font-inter)", fontSize: "14px", lineHeight: "1.5" }}
      >
        {toast.message}
      </p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 opacity-60 hover:opacity-100 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current rounded"
        aria-label="Dismiss notification"
      >
        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">close</span>
      </button>
    </div>
  );
}
