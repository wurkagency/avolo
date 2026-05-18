import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/server/auth";
import { createTrip } from "@/server/services/tripService";
import type { SearchRequest } from "@/types/search";

// ─── Validation ────────────────────────────────────────────────────────────

function validateSearchRequest(body: unknown): SearchRequest {
  if (typeof body !== "object" || body === null) {
    throw new Error("Request body must be an object");
  }

  const b = body as Record<string, unknown>;

  const departure = b["departure"];
  const departureName = b["departureName"];
  const destination = b["destination"];
  const destinationName = b["destinationName"];
  const services = b["services"];
  const departureDate = b["departureDate"];
  const returnDate = b["returnDate"];
  const isOneWay = b["isOneWay"];
  const flexibility = b["flexibility"];
  const adults = b["adults"];
  const children = b["children"];
  const hasDisability = b["hasDisability"];
  const handLuggage = b["handLuggage"];
  const checkedLuggage = b["checkedLuggage"];
  const specialLuggage = b["specialLuggage"];

  if (typeof departure !== "string" || !/^[A-Z]{3}$/.test(departure)) {
    throw new Error("departure must be a 3-letter IATA code");
  }
  if (typeof departureName !== "string" || !departureName) {
    throw new Error("departureName is required");
  }
  if (typeof destination !== "string" || !/^[A-Z]{3}$/.test(destination)) {
    throw new Error("destination must be a 3-letter IATA code");
  }
  if (typeof destinationName !== "string" || !destinationName) {
    throw new Error("destinationName is required");
  }

  const departureAirports = b["departureAirports"];
  const destinationAirports = b["destinationAirports"];
  if (departureAirports !== undefined && departureAirports !== null) {
    if (!Array.isArray(departureAirports) || departureAirports.some((c) => typeof c !== "string" || !/^[A-Z]{3}$/.test(c))) {
      throw new Error("departureAirports must be an array of 3-letter IATA codes");
    }
  }
  if (destinationAirports !== undefined && destinationAirports !== null) {
    if (!Array.isArray(destinationAirports) || destinationAirports.some((c) => typeof c !== "string" || !/^[A-Z]{3}$/.test(c))) {
      throw new Error("destinationAirports must be an array of 3-letter IATA codes");
    }
  }
  if (!Array.isArray(services) || services.length === 0) {
    throw new Error("services must be a non-empty array");
  }
  const validServices = ["FLIGHT", "HOTEL", "CAR", "EXCURSION"] as const;
  for (const svc of services) {
    if (!validServices.includes(svc as (typeof validServices)[number])) {
      throw new Error(`Invalid service type: ${String(svc)}`);
    }
  }
  if (typeof departureDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(departureDate)) {
    throw new Error("departureDate must be YYYY-MM-DD");
  }
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  if (new Date(departureDate) < now) {
    throw new Error("departureDate must be today or in the future");
  }
  if (
    returnDate !== null &&
    returnDate !== undefined &&
    (typeof returnDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(returnDate))
  ) {
    throw new Error("returnDate must be YYYY-MM-DD or null");
  }
  const oneWay = Boolean(isOneWay);

  // Validate isOneWay / returnDate consistency
  if (oneWay && typeof returnDate === "string") {
    throw new Error("returnDate must be null when isOneWay is true");
  }
  if (
    typeof returnDate === "string" &&
    new Date(returnDate) <= new Date(departureDate)
  ) {
    throw new Error("returnDate must be strictly after departureDate");
  }
  if (!oneWay && returnDate === null) {
    throw new Error("returnDate is required for return trips");
  }

  // Validate flexibility enum
  const validFlexibility = ["EXACT", "PLUS_MINUS_1", "PLUS_MINUS_3", "PLUS_MINUS_7"] as const;
  if (typeof flexibility !== "string" || !validFlexibility.includes(flexibility as (typeof validFlexibility)[number])) {
    throw new Error(`flexibility must be one of: ${validFlexibility.join(", ")}`);
  }

  if (typeof adults !== "number" || adults < 1 || adults > 9) {
    throw new Error("adults must be between 1 and 9");
  }
  if (!Array.isArray(children) || children.some((c) => typeof c !== "number" || c < 0 || c > 17)) {
    throw new Error("children must be an array of ages 0–17");
  }

  return {
    departure,
    departureName,
    destination,
    destinationName,
    ...(Array.isArray(departureAirports) ? { departureAirports: departureAirports as string[] } : {}),
    ...(Array.isArray(destinationAirports) ? { destinationAirports: destinationAirports as string[] } : {}),
    services: services as SearchRequest["services"],
    departureDate,
    returnDate: typeof returnDate === "string" ? returnDate : null,
    isOneWay: oneWay,
    flexibility: flexibility as SearchRequest["flexibility"],
    adults: adults as number,
    children: children as number[],
    hasDisability: Boolean(hasDisability),
    handLuggage: typeof handLuggage === "number" ? handLuggage : 1,
    checkedLuggage: typeof checkedLuggage === "number" ? checkedLuggage : 0,
    specialLuggage: Boolean(specialLuggage),
  };
}

// ─── POST /api/search-trip ─────────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: unknown = await request.json();
    const req = validateSearchRequest(body);

    // Auth: prefer authenticated user; fall back to anonymous session cookie
    const session = await auth();
    const userId = session?.user?.id;
    const anonId = request.cookies.get("avolo_sid")?.value;

    if (!userId && !anonId) {
      return NextResponse.json(
        { error: "No session found", code: "NO_SESSION" },
        { status: 401 },
      );
    }

    const trip = await createTrip(req, { userId, anonId });

    return NextResponse.json({ tripId: trip.id }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Search request failed";
    const isValidation = message.includes("must be") || message.includes("required");
    return NextResponse.json(
      { error: message, code: isValidation ? "VALIDATION_ERROR" : "SERVER_ERROR" },
      { status: isValidation ? 400 : 500 },
    );
  }
}
