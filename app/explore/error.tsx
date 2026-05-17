"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ExploreError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error("[explore-error]", error);
  }, [error]);

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      flex: 1,
      minHeight: "50vh",
      gap: "var(--spacing-lg)",
      padding: "var(--spacing-xl)",
      textAlign: "center",
      fontFamily: "var(--font-inter), Inter, sans-serif",
    }}>
      <h2 style={{ fontSize: 22, fontWeight: 600, margin: 0, color: "var(--color-ink)" }}>
        Something went wrong
      </h2>
      <p style={{ fontSize: 14, color: "var(--color-steel)", margin: 0, maxWidth: 360, lineHeight: 1.5 }}>
        We couldn&apos;t load this page. Please try again.
      </p>
      <div style={{ display: "flex", gap: "var(--spacing-md)" }}>
        <button
          onClick={() => router.push("/explore")}
          style={{
            padding: "10px 20px",
            borderRadius: "var(--rounded-md)",
            border: "1px solid var(--color-hairline-strong)",
            backgroundColor: "var(--color-canvas)",
            color: "var(--color-ink)",
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Start over
        </button>
        <button
          onClick={reset}
          style={{
            padding: "10px 20px",
            borderRadius: "var(--rounded-md)",
            border: "none",
            backgroundColor: "var(--color-primary)",
            color: "var(--color-on-primary)",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </div>
    </div>
  );
}
