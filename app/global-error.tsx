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
      <head>
        <style>{`
          *{box-sizing:border-box;margin:0;padding:0}
          body{
            font-family:Inter,sans-serif;
            background:var(--color-surface,#f9f9f7);
            color:var(--color-ink,#1f1f1f);
            display:flex;align-items:center;justify-content:center;
            min-height:100vh;padding:24px;
          }
          .wrap{max-width:480px;width:100%;text-align:center;display:flex;flex-direction:column;gap:20px}
          h1{font-size:28px;font-weight:600}
          p{font-size:15px;color:var(--color-steel,#6a6a6a);line-height:1.5}
          .row{display:flex;gap:12px;justify-content:center}
          .btn-ghost{padding:12px 24px;border-radius:8px;border:1px solid var(--color-hairline,#e5e5e5);background:var(--color-canvas,#fff);color:var(--color-ink,#1f1f1f);font-size:15px;font-weight:500;cursor:pointer}
          .btn-primary{padding:12px 24px;border-radius:8px;border:none;background:var(--color-primary,#fa520f);color:var(--color-on-primary,#fff);font-size:15px;font-weight:600;cursor:pointer}
        `}</style>
      </head>
      <body>
        <div className="wrap">
          <h1>Something went wrong</h1>
          <p>An unexpected error occurred. Please try refreshing the page.</p>
          <div className="row">
            <button className="btn-ghost" onClick={() => { window.location.href = "/explore"; }}>Go home</button>
            <button className="btn-primary" onClick={reset}>Try again</button>
          </div>
        </div>
      </body>
    </html>
  );
}
