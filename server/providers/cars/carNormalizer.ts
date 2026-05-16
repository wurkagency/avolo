import type { NormalizedResult } from "@/types/search";
import type { TravelPayoutsCarRaw } from "./travelPayoutsCarProvider";

export function normalizeCars(raw: TravelPayoutsCarRaw[]): NormalizedResult[] {
  return raw.map((car) => {
    const isRefundable = true; // most car rentals allow free cancellation
    const riskReasons: string[] = [];
    if (car.insurance === "basic") riskReasons.push("Basic insurance only");

    return {
      id: `tp-car-${car.id}`,
      serviceType: "CAR",
      provider: "travelpayouts",
      priceEur: car.totalPriceEur,
      riskLevel: car.insurance === "basic" ? "MEDIUM" : "LOW",
      riskReasons,
      isRefundable,
      deepLinkUrl: car.deepLink,
      rank: 0,
      aiSlot: null,
      aiSummary: null,
      flight: null,
      hotel: null,
      car: {
        make: car.make,
        model: car.model,
        category: car.category,
        seats: car.seats,
        pickupLocation: car.pickupLocation,
        dropoffLocation: car.dropoffLocation,
        pickupDate: car.pickupDate,
        dropoffDate: car.dropoffDate,
        days: car.days,
        insurance: car.insurance,
        supplier: car.supplier,
        imageUrl: car.imageUrl,
      },
      excursion: null,
    } satisfies NormalizedResult;
  });
}
