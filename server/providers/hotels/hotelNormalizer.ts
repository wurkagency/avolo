import type { NormalizedResult } from "@/types/search";
import type { HotellookHotelRaw } from "./travelPayoutsHotelProvider";

export function normalizeHotels(raw: HotellookHotelRaw[]): NormalizedResult[] {
  return raw.flatMap((hotel) => {
    const bestRoom = hotel.rooms[0];
    if (!bestRoom) return [];

    const isRefundable = bestRoom.cancellation === "free";
    const riskReasons: string[] = [];
    if (!isRefundable) riskReasons.push("Non-refundable rate");
    if (!hotel.guestScore || hotel.guestScore < 60) riskReasons.push("Limited reviews");

    const ratingOutOf10 = hotel.guestScore !== null ? hotel.guestScore / 10 : null;

    return [
      {
        id: `tp-hotel-${hotel.hotelId}-${bestRoom.type}`,
        serviceType: "HOTEL",
        provider: "travelpayouts",
        priceEur: bestRoom.price,
        riskLevel: isRefundable ? "LOW" : "MEDIUM",
        riskReasons,
        isRefundable,
        deepLinkUrl: bestRoom.deepLink,
        rank: 0,
        aiSlot: null,
        aiSummary: null,
        flight: null,
        hotel: {
          name: hotel.hotelName,
          stars: hotel.stars,
          rating: ratingOutOf10,
          reviewCount: hotel.reviewsCount,
          address: hotel.address ?? "",
          distanceFromCenterKm: hotel.distanceToCentre,
          checkIn: hotel.checkIn,
          checkOut: hotel.checkOut,
          nights: hotel.nights,
          roomType: bestRoom.type,
          breakfast: bestRoom.breakfast,
          cancellationPolicy: bestRoom.cancellation,
          imageUrl: hotel.photoUrl,
        },
        car: null,
        excursion: null,
      } satisfies NormalizedResult,
    ];
  });
}
