"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error("[app-error]", error);
  }, [error]);

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      gap: "var(--spacing-lg)",
      padding: "var(--spacing-xl)",
      textAlign: "center",
      fontFamily: "var(--font-inter), Inter, sans-serif",
    }}>
      <h1 style={{ fontSize: 26, fontWeight: 600, margin: 0, color: "var(--color-ink)" }}>
        Something went wrong
      </h1>
      <p style={{ fontSize: 15, color: "var(--color-steel)", margin: 0, maxWidth: 400, lineHeight: 1.5 }}>
        An unexpected error occurred. You can try again or go back to the home page.
      </p>
      <div style={{ display: "flex", gap: "var(--spacing-md)" }}>
        <button
          onClick={() => router.push("/explore")}
          style={{
            padding: "12px 24px",
            borderRadius: "var(--rounded-md)",
            border: "1px solid var(--color-hairline-strong)",
            backgroundColor: "var(--color-canvas)",
            color: "var(--color-ink)",
            fontSize: 15,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Go home
        </button>
        <button
          onClick={reset}
          style={{
            padding: "12px 24px",
            borderRadius: "var(--rounded-md)",
            border: "none",
            backgroundColor: "var(--color-primary)",
            color: "var(--color-on-primary)",
            fontSize: 15,
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
