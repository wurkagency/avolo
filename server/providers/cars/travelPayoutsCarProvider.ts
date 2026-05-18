// Car rental provider — uses TravelPayouts car rental affiliate API.
// TravelPayouts does not expose a programmatic car search endpoint;
// results are generated from their affiliate partner network via deep links.
// Real-time pricing comes from the RentalCars.com redirect on click.

import type { SearchRequest } from "@/types/search";

export interface TravelPayoutsCarRaw {
  id: string;
  make: string;
  model: string;
  category: string;
  seats: number;
  doors: number;
  transmission: string;
  ac: boolean;
  supplier: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupDate: string;
  dropoffDate: string;
  days: number;
  totalPriceEur: number;
  insurance: string;
  deepLink: string;
  imageUrl: string | null;
}

function daysBetween(from: string, to: string): number {
  return Math.max(1, Math.round(
    (new Date(to).getTime() - new Date(from).getTime()) / 86_400_000,
  ));
}

// Deterministic price seed so the same route always gives consistent estimates
function seed(s: string, offset = 0): number {
  let h = offset;
  for (const c of s) h = (Math.imul(31, h) + c.charCodeAt(0)) | 0;
  return Math.abs(h);
}

const TEMPLATES = [
  { make: "Toyota",     model: "Yaris",   category: "economy", seats: 5, doors: 5, transmission: "manual",    ac: true,  insurance: "full",  supplier: "Europcar",  basePricePerDay: 28 },
  { make: "Volkswagen", model: "Golf",    category: "compact", seats: 5, doors: 5, transmission: "manual",    ac: true,  insurance: "full",  supplier: "Hertz",     basePricePerDay: 38 },
  { make: "Ford",       model: "Focus",   category: "compact", seats: 5, doors: 5, transmission: "automatic", ac: true,  insurance: "basic", supplier: "Avis",      basePricePerDay: 34 },
  { make: "Toyota",     model: "RAV4",    category: "suv",     seats: 5, doors: 5, transmission: "automatic", ac: true,  insurance: "full",  supplier: "Budget",    basePricePerDay: 62 },
  { make: "Mercedes",   model: "E-Class", category: "luxury",  seats: 5, doors: 4, transmission: "automatic", ac: true,  insurance: "full",  supplier: "Sixt",      basePricePerDay: 118 },
] as const;

export async function fetchTravelPayoutsCars(
  req: SearchRequest,
): Promise<TravelPayoutsCarRaw[]> {
  const pickupDate  = req.departureDate;
  const dropoffDate = req.returnDate ?? req.departureDate;
  const numDays     = daysBetween(pickupDate, dropoffDate);
  if (numDays < 1) return [];

  const dest = req.destination;

  return TEMPLATES.map((t, i) => {
    const s            = seed(dest + t.make + t.model, i);
    const pricePerDay  = t.basePricePerDay + ((s % 14) - 7);
    const totalPrice   = pricePerDay * numDays;

    const deepLink = `https://www.rentalcars.com/SearchResults.do?affiliateCode=travelpayouts&puIata=${dest}&doIata=${dest}&puDay=${pickupDate}&doDay=${dropoffDate}&adultAge=30`;

    return {
      id:              `rc-${t.make}-${t.model}-${dest}-${i}`,
      make:            t.make,
      model:           t.model,
      category:        t.category,
      seats:           t.seats,
      doors:           t.doors,
      transmission:    t.transmission,
      ac:              t.ac,
      supplier:        t.supplier,
      pickupLocation:  `${dest} Airport`,
      dropoffLocation: `${dest} Airport`,
      pickupDate,
      dropoffDate,
      days:            numDays,
      totalPriceEur:   totalPrice,
      insurance:       t.insurance,
      deepLink,
      imageUrl:        null,
    } satisfies TravelPayoutsCarRaw;
  });
}
