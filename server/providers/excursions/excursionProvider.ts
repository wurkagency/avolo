// Excursion provider — GetYourGuide Partner API.
// Requires GETYOURGUIDE_API_KEY. Returns empty when not configured
// so the searchService falls back to excursionFallbacks().

import type { SearchRequest } from "@/types/search";
import type { ExcursionRaw } from "./excursionNormalizer";

const BASE = "https://api.getyourguide.com/1";

export const CATEGORIES = ["culture", "food", "nature", "adventure"] as const;

interface GygTour {
  tour_id:       string | number;
  title?:        string;
  abstract?:     string;
  duration?:     number;       // minutes
  retail_price?: { currency: string; value: number };
  url?:          string;
  pictures?:     { url?: string }[];
  categories?:   { id: number; name: string }[];
  is_refundable?: boolean;
}

interface GygResponse {
  data?: { tours?: GygTour[] };
}

function toCategory(tour: GygTour): string {
  const name = (tour.categories?.[0]?.name ?? "").toLowerCase();
  if (name.includes("food") || name.includes("drink") || name.includes("culinary")) return "food";
  if (name.includes("nature") || name.includes("outdoor") || name.includes("hiking")) return "nature";
  if (name.includes("adventure") || name.includes("sport") || name.includes("extreme")) return "adventure";
  return "culture";
}

export async function fetchExcursions(req: SearchRequest): Promise<ExcursionRaw[]> {
  const apiKey = process.env.GETYOURGUIDE_API_KEY;
  if (!apiKey) {
    console.info(`[excursions] GETYOURGUIDE_API_KEY not configured — skipping`);
    return [];
  }

  const query = req.destinationName || req.destination;
  const totalParticipants = Math.max(1, req.adults + req.children.length);

  const params = new URLSearchParams({
    q:        query,
    count:    "20",
    language: "en",
    currency: "EUR",
  });

  let res: Response;
  try {
    res = await fetch(`${BASE}/tours?${params.toString()}`, {
      headers: {
        "X-ACCESS-TOKEN": apiKey,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(15_000),
    });
  } catch (err) {
    throw new Error(`GetYourGuide request failed: ${err instanceof Error ? err.message : err}`);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`GetYourGuide API error ${res.status}: ${body.slice(0, 200)}`);
  }

  const body = await res.json() as GygResponse;
  const tours = body?.data?.tours;

  if (!Array.isArray(tours)) {
    throw new Error("GetYourGuide returned unexpected response shape");
  }

  return tours
    .filter((t): t is GygTour => !!t.retail_price?.value && !!t.title)
    .map((t): ExcursionRaw => ({
      id:               String(t.tour_id),
      title:            t.title!,
      description:      t.abstract ?? "",
      durationHours:    t.duration ? t.duration / 60 : 2,
      category:         toCategory(t),
      location:         query,
      date:             req.departureDate,
      priceEurPerPerson: t.retail_price!.value,
      totalParticipants,
      includes:         [],
      groupSize:        null,
      imageUrl:         t.pictures?.[0]?.url ?? null,
      isRefundable:     t.is_refundable ?? true,
      deepLink:         t.url ?? `https://www.getyourguide.com/s/?q=${encodeURIComponent(query)}`,
    }));
}
