// Client-side: POST /api/search-trip and return tripId.

import type { SearchRequest } from "@/types/search";

export interface SearchResponse {
  tripId: string;
}

export async function createSearch(req: SearchRequest): Promise<SearchResponse> {
  const res = await fetch("/api/search-trip", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Unknown error" })) as {
      error?: string;
    };
    throw new Error(body.error ?? `Search failed with status ${res.status}`);
  }

  return res.json() as Promise<SearchResponse>;
}
