"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global-error]", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily: "Inter, sans-serif",
          backgroundColor: "#f9f9f7",
          color: "#1f1f1f",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100dvh",
          padding: "24px",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            maxWidth: 480,
            width: "100%",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          <h1 style={{ fontSize: 28, fontWeight: 600, margin: 0 }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: 15, color: "#6a6a6a", margin: 0, lineHeight: 1.5 }}>
            An unexpected error occurred. Please try refreshing the page.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button
              onClick={() => { window.location.href = "/explore"; }}
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
      </body>
    </html>
  );
}
