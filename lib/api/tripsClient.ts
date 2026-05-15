import type { NormalizedResult } from "@/types/search";
import type { ServiceType } from "@/types/trip";

export interface PaginatedResults {
  results: NormalizedResult[];
  total: number;
  page: number;
  pages: number;
}

export async function fetchTripResults(
  tripId: string,
  opts: { serviceType?: ServiceType; page?: number } = {},
): Promise<PaginatedResults> {
  const params = new URLSearchParams();
  if (opts.serviceType) params.set("serviceType", opts.serviceType);
  if (opts.page) params.set("page", String(opts.page));

  const res = await fetch(`/api/trips/${encodeURIComponent(tripId)}/results?${params.toString()}`);

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Unknown error" })) as { error?: string };
    throw new Error(body.error ?? `Failed to fetch results: ${res.status}`);
  }

  return res.json() as Promise<PaginatedResults>;
}
