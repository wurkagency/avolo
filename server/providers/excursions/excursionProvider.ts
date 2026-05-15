// Excursion provider — currently a structured stub.
// TravelPayouts does not offer a programmatic excursions API.
// Replace with Viator / GetYourGuide API in a future phase.

import type { SearchRequest } from "@/types/search";
import type { ExcursionRaw } from "./excursionNormalizer";

const CATEGORIES = ["culture", "food", "nature", "adventure"] as const;

export async function fetchExcursions(req: SearchRequest): Promise<ExcursionRaw[]> {
  // Return empty until a real excursions API is wired up.
  // The UI handles empty arrays gracefully with an empty state.
  console.info(`[excursions] No provider configured for ${req.destination} — returning empty`);
  return [];
}

export { CATEGORIES };
