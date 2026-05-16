import type { NormalizedResult } from "@/types/search";
import type { SearchRequest } from "@/types/search";

function seed(s: string, offset = 0): number {
  let h = offset;
  for (const c of s) h = (Math.imul(31, h) + c.charCodeAt(0)) | 0;
  return Math.abs(h);
}

function nights(req: SearchRequest): number {
  if (!req.returnDate) return 1;
  return Math.max(1, Math.round(
    (new Date(req.returnDate).getTime() - new Date(req.departureDate).getTime()) / 86_400_000,
  ));
}

function days(req: SearchRequest): number {
  return nights(req);
}

// ── Hotels ─────────────────────────────────────────────────────────────────

const HOTEL_TEMPLATES = [
  { suffix: "Grand Hotel", stars: 5, basePrice: 290, room: "Deluxe Room", breakfast: true },
  { suffix: "Boutique", stars: 4, basePrice: 165, room: "Superior Room", breakfast: false },
  { suffix: "City Centre", stars: 4, basePrice: 135, room: "Standard Room", breakfast: false },
  { suffix: "Express Inn", stars: 3, basePrice: 88, room: "Economy Room", breakfast: false },
  { suffix: "Stay & Go", stars: 3, basePrice: 58, room: "Basic Room", breakfast: false },
] as const;

export function hotelFallbacks(req: SearchRequest): NormalizedResult[] {
  const dest = req.destinationName || req.destination;
  const stayNights = nights(req);
  const checkIn = req.departureDate;
  const checkOut = req.returnDate ?? req.departureDate;

  return HOTEL_TEMPLATES.map((t, i) => {
    const s = seed(dest, i);
    const pricePerNight = t.basePrice + ((s % 30) - 15);
    const totalPrice = pricePerNight * stayNights;
    const isRefundable = i < 3;
    const deepLink = `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(dest)}&checkin=${checkIn}&checkout=${checkOut}&no_rooms=1&group_adults=${req.adults}`;

    return {
      id: `stub-hotel-${i}-${dest}`,
      serviceType: "HOTEL",
      provider: "stub",
      priceEur: totalPrice,
      riskLevel: isRefundable ? "LOW" : "MEDIUM",
      riskReasons: isRefundable ? [] : ["Non-refundable rate"],
      isRefundable,
      deepLinkUrl: deepLink,
      rank: i,
      aiSlot: null,
      aiSummary: null,
      flight: null,
      hotel: {
        name: `${dest} ${t.suffix}`,
        stars: t.stars,
        rating: 7 + ((s % 3)),
        reviewCount: 200 + (s % 800),
        address: `${dest} City Centre`,
        distanceFromCenterKm: (i * 0.5) + 0.2,
        checkIn,
        checkOut,
        nights: stayNights,
        roomType: t.room,
        breakfast: t.breakfast,
        cancellationPolicy: isRefundable ? "free" : "non-refundable",
        imageUrl: null,
      },
      car: null,
      excursion: null,
    } satisfies NormalizedResult;
  });
}

// ── Cars ───────────────────────────────────────────────────────────────────

const CAR_TEMPLATES = [
  { make: "Toyota", model: "Yaris", category: "economy", seats: 5, basePrice: 35, insurance: "full", supplier: "Europcar" },
  { make: "Volkswagen", model: "Golf", category: "compact", seats: 5, basePrice: 52, insurance: "full", supplier: "Hertz" },
  { make: "Ford", model: "Focus", category: "compact", seats: 5, basePrice: 44, insurance: "basic", supplier: "Avis" },
  { make: "Toyota", model: "RAV4", category: "suv", seats: 5, basePrice: 78, insurance: "full", supplier: "Budget" },
  { make: "Mercedes", model: "E-Class", category: "luxury", seats: 5, basePrice: 145, insurance: "full", supplier: "Sixt" },
] as const;

export function carFallbacks(req: SearchRequest): NormalizedResult[] {
  const dest = req.destinationName || req.destination;
  const rentalDays = days(req);
  const pickupDate = req.departureDate;
  const dropoffDate = req.returnDate ?? req.departureDate;

  return CAR_TEMPLATES.map((c, i) => {
    const s = seed(dest, i);
    const pricePerDay = c.basePrice + ((s % 10) - 5);
    const totalPrice = pricePerDay * rentalDays;
    const deepLink = `https://www.rentalcars.com/SearchResults.do?affiliateCode=booking&puIata=${req.destination}&doIata=${req.destination}&puDay=${pickupDate}&doDay=${dropoffDate}`;

    return {
      id: `stub-car-${i}-${dest}`,
      serviceType: "CAR",
      provider: "stub",
      priceEur: totalPrice,
      riskLevel: c.insurance === "basic" ? "MEDIUM" : "LOW",
      riskReasons: c.insurance === "basic" ? ["Basic insurance only"] : [],
      isRefundable: true,
      deepLinkUrl: deepLink,
      rank: i,
      aiSlot: null,
      aiSummary: null,
      flight: null,
      hotel: null,
      car: {
        make: c.make,
        model: c.model,
        category: c.category,
        seats: c.seats,
        pickupLocation: `${dest} Airport`,
        dropoffLocation: `${dest} Airport`,
        pickupDate,
        dropoffDate,
        days: rentalDays,
        insurance: c.insurance,
        supplier: c.supplier,
        imageUrl: null,
      },
      excursion: null,
    } satisfies NormalizedResult;
  });
}

// ── Excursions ─────────────────────────────────────────────────────────────

const EXCURSION_TEMPLATES = [
  { suffix: "City Walking Tour", category: "culture", duration: 2.5, pricePerPerson: 25, includes: ["Local guide", "Map"] },
  { suffix: "Food & Markets Tour", category: "food", duration: 3, pricePerPerson: 55, includes: ["Tastings", "Guide"] },
  { suffix: "Nature Day Trip", category: "nature", duration: 8, pricePerPerson: 90, includes: ["Transport", "Guide", "Lunch"] },
  { suffix: "Adventure Experience", category: "adventure", duration: 4, pricePerPerson: 120, includes: ["Equipment", "Guide", "Insurance"] },
] as const;

export function excursionFallbacks(req: SearchRequest): NormalizedResult[] {
  const dest = req.destinationName || req.destination;
  const totalParticipants = Math.max(1, req.adults + req.children.length);
  const deepLink = `https://www.getyourguide.com/s/?q=${encodeURIComponent(dest)}&searchSource=1`;

  return EXCURSION_TEMPLATES.map((e, i) => ({
    id: `stub-excursion-${i}-${dest}`,
    serviceType: "EXCURSION",
    provider: "stub",
    priceEur: e.pricePerPerson * totalParticipants,
    riskLevel: "LOW",
    riskReasons: [],
    isRefundable: true,
    deepLinkUrl: deepLink,
    rank: i,
    aiSlot: null,
    aiSummary: null,
    flight: null,
    hotel: null,
    car: null,
    excursion: {
      title: `${dest} ${e.suffix}`,
      description: `Discover the best of ${dest} on this curated ${e.category} experience.`,
      durationHours: e.duration,
      category: e.category,
      location: dest,
      date: req.departureDate,
      includes: [...e.includes],
      groupSize: "Up to 15 people",
      imageUrl: null,
    },
  } satisfies NormalizedResult));
}
