import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/server/auth";
import { callAI } from "@/lib/ai/aiClient";
import { buildQueryPrompt } from "@/lib/ai/queryPrompt";
import type { TripDraft, ServiceType, Flexibility, ParsedQuery } from "@/types/trip";

export type { ParsedQuery };

// ─── Validation constants ─────────────────────────────────────────────────────

const VALID_SERVICES: ServiceType[] = ["FLIGHT", "HOTEL", "CAR", "EXCURSION"];
const VALID_FLEX: Flexibility[]     = ["EXACT", "PLUS_MINUS_1", "PLUS_MINUS_3", "PLUS_MINUS_7"];
const IATA_RE                       = /^[A-Z]{3}$/;
const DATE_RE                       = /^\d{4}-\d{2}-\d{2}$/;

// ─── Extract JSON from AI output (handles leading prose + fenced blocks) ──────

function extractJson(raw: string): string {
  // If it looks like a bare JSON object or array, return as-is
  const trimmed = raw.trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) return trimmed;

  // Find the first ``` fence and extract the content inside it
  const fenceMatch = /```(?:json)?\s*([\s\S]*?)\s*```/i.exec(raw);
  if (fenceMatch?.[1]) return fenceMatch[1].trim();

  // Last resort: find the first { and last } and extract
  const start = raw.indexOf("{");
  const end   = raw.lastIndexOf("}");
  if (start !== -1 && end > start) return raw.slice(start, end + 1);

  return trimmed;
}

// ─── Sanitise raw AI output ───────────────────────────────────────────────────

function sanitise(raw: unknown, today: Date): ParsedQuery {
  if (typeof raw !== "object" || raw === null) return { filledFields: [] };

  const obj    = raw as Record<string, unknown>;
  const result: Partial<TripDraft> = {};
  const filled: (keyof TripDraft)[] = [];

  // ── departure ──────────────────────────────────────────────────────────────
  const dep = obj["departure"];
  if (dep && typeof dep === "object") {
    const d    = dep as Record<string, unknown>;
    const iata = typeof d["iata"] === "string" ? d["iata"].trim().toUpperCase() : "";
    const name = typeof d["name"] === "string" ? d["name"].trim() : "";
    if (IATA_RE.test(iata) && name) {
      result.departure = { iata, name };
      filled.push("departure");
    }
  }

  // ── destination ────────────────────────────────────────────────────────────
  const dst = obj["destination"];
  if (dst && typeof dst === "object") {
    const d    = dst as Record<string, unknown>;
    const iata = typeof d["iata"] === "string" ? d["iata"].trim().toUpperCase() : "";
    const name = typeof d["name"] === "string" ? d["name"].trim() : "";
    if (IATA_RE.test(iata) && name) {
      result.destination = { iata, name };
      filled.push("destination");
    }
  }

  // ── services ───────────────────────────────────────────────────────────────
  const svcs = obj["services"];
  if (Array.isArray(svcs)) {
    const valid = svcs.filter((s): s is ServiceType =>
      VALID_SERVICES.includes(s as ServiceType),
    );
    if (valid.length > 0) {
      result.services = valid;
      filled.push("services");
    }
  }

  // ── isOneWay ───────────────────────────────────────────────────────────────
  const oneWay = typeof obj["isOneWay"] === "boolean" ? obj["isOneWay"] : false;
  result.isOneWay = oneWay;
  if (oneWay) filled.push("isOneWay");

  // ── departureDate ──────────────────────────────────────────────────────────
  const depDate = obj["departureDate"];
  if (typeof depDate === "string" && DATE_RE.test(depDate)) {
    // Construct as local midnight to match server-side today comparison
    const d = new Date(depDate + "T00:00:00");
    if (d >= today) {
      result.departureDate = depDate;
      filled.push("departureDate");
    }
  }

  // ── returnDate ─────────────────────────────────────────────────────────────
  if (oneWay) {
    result.returnDate = null;
  } else {
    const retDate = obj["returnDate"];
    if (typeof retDate === "string" && DATE_RE.test(retDate)) {
      const rd   = new Date(retDate + "T00:00:00");
      const depD = result.departureDate
        ? new Date(result.departureDate + "T00:00:00")
        : today;
      if (rd > depD) {
        result.returnDate = retDate;
        filled.push("returnDate");
      } else {
        result.returnDate = null;
      }
    } else {
      result.returnDate = null;
    }
  }

  // ── flexibility ────────────────────────────────────────────────────────────
  const flex = obj["flexibility"];
  if (typeof flex === "string" && VALID_FLEX.includes(flex as Flexibility)) {
    result.flexibility = flex as Flexibility;
    if (flex !== "EXACT") filled.push("flexibility");
  } else {
    result.flexibility = "EXACT";
  }

  // ── adults — push to filledFields whenever the AI value was valid ──────────
  const adults = obj["adults"];
  if (typeof adults === "number" && Number.isInteger(adults) && adults >= 1 && adults <= 9) {
    result.adults = adults;
    filled.push("adults");
  } else {
    result.adults = 1;
  }

  // ── children ───────────────────────────────────────────────────────────────
  const children = obj["children"];
  if (Array.isArray(children)) {
    const valid = children.filter(
      (c): c is number =>
        typeof c === "number" && Number.isInteger(c) && c >= 0 && c <= 17,
    );
    result.children = valid;
    if (valid.length > 0) filled.push("children");
  } else {
    result.children = [];
  }

  // ── hasDisability ──────────────────────────────────────────────────────────
  const dis = typeof obj["hasDisability"] === "boolean" ? obj["hasDisability"] : false;
  result.hasDisability = dis;
  if (dis) filled.push("hasDisability");

  // ── handLuggage ────────────────────────────────────────────────────────────
  const hl = obj["handLuggage"];
  result.handLuggage =
    typeof hl === "number" && Number.isInteger(hl) && hl >= 0 && hl <= 9 ? hl : 1;

  // ── checkedLuggage ─────────────────────────────────────────────────────────
  const cl = obj["checkedLuggage"];
  const checkedVal =
    typeof cl === "number" && Number.isInteger(cl) && cl >= 0 && cl <= 9 ? cl : 0;
  result.checkedLuggage = checkedVal;
  if (checkedVal > 0) filled.push("checkedLuggage");

  // ── specialLuggage ─────────────────────────────────────────────────────────
  const special =
    typeof obj["specialLuggage"] === "boolean" ? obj["specialLuggage"] : false;
  result.specialLuggage = special;
  if (special) filled.push("specialLuggage");

  return { ...result, filledFields: filled };
}

// ─── POST /api/interpret-query ────────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Require at least an anonymous session — prevents unauthenticated AI abuse
    const session = await auth();
    const userId  = session?.user?.id;
    const anonId  = request.cookies.get("avolo_sid")?.value;
    if (!userId && !anonId) {
      return NextResponse.json({ error: "No session" }, { status: 401 });
    }

    const body: unknown = await request.json().catch(() => null);
    if (typeof body !== "object" || body === null) {
      return NextResponse.json({ error: "Body must be JSON object" }, { status: 400 });
    }

    const { query } = body as Record<string, unknown>;
    if (typeof query !== "string" || query.trim().length === 0) {
      return NextResponse.json({ error: "query is required" }, { status: 400 });
    }

    // Slice to 500 chars to limit prompt injection surface
    const trimmed  = query.trim().slice(0, 500);
    const today    = new Date();
    today.setHours(0, 0, 0, 0);
    const todayIso = today.toISOString().slice(0, 10);

    const prompt = buildQueryPrompt(trimmed, todayIso);
    const rawAI  = await callAI(prompt);
    const cleaned = extractJson(rawAI);

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("[interpret-query] unparseable AI output:", cleaned);
      return NextResponse.json(
        { error: "AI returned unparseable JSON", filledFields: [] },
        { status: 502 },
      );
    }

    const result = sanitise(parsed, today);
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "interpret-query failed";
    console.error("[interpret-query]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
