import type { NormalizedResult } from "@/types/search";

export interface ExcursionRaw {
  id: string;
  title: string;
  description: string;
  durationHours: number;
  category: string;
  location: string;
  date: string;
  priceEurPerPerson: number;
  totalParticipants: number;
  includes: string[];
  groupSize: string | null;
  imageUrl: string | null;
  isRefundable: boolean;
  deepLink: string;
}

export function normalizeExcursions(raw: ExcursionRaw[]): NormalizedResult[] {
  return raw.map((exc) => ({
    id: `excursion-${exc.id}`,
    serviceType: "EXCURSION",
    provider: "excursion",
    priceEur: exc.priceEurPerPerson * exc.totalParticipants,
    riskLevel: exc.isRefundable ? "LOW" : "MEDIUM",
    riskReasons: exc.isRefundable ? [] : ["Non-refundable booking"],
    isRefundable: exc.isRefundable,
    deepLinkUrl: exc.deepLink,
    rank: 0,
    aiSlot: null,
    aiSummary: null,
    flight: null,
    hotel: null,
    car: null,
    excursion: {
      title: exc.title,
      description: exc.description,
      durationHours: exc.durationHours,
      category: exc.category,
      location: exc.location,
      date: exc.date,
      includes: exc.includes,
      groupSize: exc.groupSize,
      imageUrl: exc.imageUrl,
    },
  } satisfies NormalizedResult));
}
