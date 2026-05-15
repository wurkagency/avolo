"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useUiStore } from "@/lib/state/uiStore";

/**
 * Triggers the anonymous → authenticated session merge once per user ID.
 * Tracks the last merged user ID so re-login after logout fires again correctly.
 */
export function SessionMergeProvider() {
  const { data: session, status } = useSession();
  const lastMergedUserId = useRef<string | null>(null);
  const addToast = useUiStore((s) => s.addToast);

  useEffect(() => {
    if (status !== "authenticated") return;

    const userId = session?.user?.id;
    if (!userId) return;

    // Only merge once per unique user ID
    if (lastMergedUserId.current === userId) return;
    lastMergedUserId.current = userId;

    fetch("/api/auth/merge", { method: "POST" })
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({})) as { error?: string };
          console.error("[merge] API error:", body.error ?? res.statusText);
          return;
        }
        const data = await res.json() as { merged?: number };
        if (typeof data.merged === "number" && data.merged > 0) {
          addToast(
            `${data.merged} saved trip${data.merged === 1 ? "" : "s"} linked to your account.`,
            "success",
          );
        }
      })
      .catch((err: unknown) => {
        console.error("[merge] Network error:", err);
      });
  }, [status, session?.user?.id, addToast]);

  return null;
}
