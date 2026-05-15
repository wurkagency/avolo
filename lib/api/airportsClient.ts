import type { AirportOption } from "@/types/trip";

export async function searchAirports(query: string, signal?: AbortSignal): Promise<AirportOption[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const res = await fetch(`/api/airports?q=${encodeURIComponent(q)}`, {
    signal: signal ?? AbortSignal.timeout(5000),
  });

  if (!res.ok) return [];

  const data = await res.json() as { airports: AirportOption[] };
  return data.airports ?? [];
}
