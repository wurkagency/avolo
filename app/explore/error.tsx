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
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        flex: 1,
        gap: 20,
        padding: 24,
        textAlign: "center",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <h2 style={{ fontSize: 22, fontWeight: 600, margin: 0, color: "#1f1f1f" }}>
        Something went wrong
      </h2>
      <p style={{ fontSize: 14, color: "#6a6a6a", margin: 0, maxWidth: 360, lineHeight: 1.5 }}>
        We couldn&apos;t load this page. Please try again.
      </p>
      <div style={{ display: "flex", gap: 12 }}>
        <button
          onClick={() => router.push("/explore")}
          style={{
            padding: "10px 20px",
            borderRadius: 8,
            border: "1px solid #e5e5e5",
            backgroundColor: "#ffffff",
            color: "#1f1f1f",
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
            borderRadius: 8,
            border: "none",
            backgroundColor: "#fa520f",
            color: "#ffffff",
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
