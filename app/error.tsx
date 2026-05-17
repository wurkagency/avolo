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
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100dvh",
        gap: 20,
        padding: 24,
        textAlign: "center",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <h1 style={{ fontSize: 26, fontWeight: 600, margin: 0, color: "#1f1f1f" }}>
        Something went wrong
      </h1>
      <p style={{ fontSize: 15, color: "#6a6a6a", margin: 0, maxWidth: 400, lineHeight: 1.5 }}>
        An unexpected error occurred. You can try again or go back to the home page.
      </p>
      <div style={{ display: "flex", gap: 12 }}>
        <button
          onClick={() => router.push("/explore")}
          style={{
            padding: "12px 24px",
            borderRadius: 8,
            border: "1px solid #e5e5e5",
            backgroundColor: "#ffffff",
            color: "#1f1f1f",
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
            borderRadius: 8,
            border: "none",
            backgroundColor: "#fa520f",
            color: "#ffffff",
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
