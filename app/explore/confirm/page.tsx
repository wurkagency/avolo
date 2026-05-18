"use client";

import { QueryConfirmCard } from "@/components/explore/QueryConfirmCard";

export default function ExploreConfirmPage() {
  return (
    <div
      className="bg-surface"
      style={{
        flex:          1,
        display:       "flex",
        flexDirection: "column",
        minHeight:     "100dvh",
        padding:       "var(--spacing-section) var(--spacing-xl)",
        paddingBottom: "var(--spacing-section)",
      }}
    >
      <QueryConfirmCard />
    </div>
  );
}
