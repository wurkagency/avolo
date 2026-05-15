// GET /api/search/stream?tripId=<id>
//
// Server-Sent Events endpoint.
// Validates trip ownership, then streams search results as they arrive.
//
// SSE protocol (must always end with done):
//   data: {"event":"status","message":"..."}
//   data: {"event":"category","type":"FLIGHT","results":[...]}
//   data: {"event":"category","type":"HOTEL","results":[...]}
//   data: {"event":"done"}
//
// GUARANTEE: {"event":"done"} is ALWAYS emitted, even on error, via try/finally.

import { type NextRequest } from "next/server";
import { auth } from "@/lib/server/auth";
import { getTripForSession, getTripServices, markTripSearching } from "@/server/services/tripService";
import { runSearch, type EmitFn } from "@/server/services/searchService";
import type { SSEEvent } from "@/types/search";

// SSE requires these specific headers
function sseHeaders(): HeadersInit {
  return {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no", // disable Nginx buffering on Plesk
  };
}

// Encode a single SSE data frame
function encodeEvent(event: SSEEvent): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(event)}\n\n`);
}

export async function GET(request: NextRequest): Promise<Response> {
  const tripId = request.nextUrl.searchParams.get("tripId");

  if (!tripId) {
    return new Response(
      `data: ${JSON.stringify({ event: "error", message: "Missing tripId" })}\n\n` +
      `data: ${JSON.stringify({ event: "done" })}\n\n`,
      { status: 400, headers: sseHeaders() },
    );
  }

  // Auth check
  const session = await auth();
  const userId = session?.user?.id;
  const anonId = request.cookies.get("avolo_sid")?.value;

  if (!userId && !anonId) {
    return new Response(
      `data: ${JSON.stringify({ event: "error", message: "Unauthorized" })}\n\n` +
      `data: ${JSON.stringify({ event: "done" })}\n\n`,
      { status: 401, headers: sseHeaders() },
    );
  }

  // Ownership check
  const trip = await getTripForSession(tripId, { userId, anonId });

  if (!trip) {
    return new Response(
      `data: ${JSON.stringify({ event: "error", message: "Trip not found" })}\n\n` +
      `data: ${JSON.stringify({ event: "done" })}\n\n`,
      { status: 404, headers: sseHeaders() },
    );
  }

  // Guard: reject if trip already searched — prevents duplicate DB rows
  if (trip.status === "COMPLETE" || trip.status === "SEARCHING") {
    return new Response(
      `data: ${JSON.stringify({ event: "error", message: "Trip already searched" })}\n\n` +
      `data: ${JSON.stringify({ event: "done" })}\n\n`,
      { status: 409, headers: sseHeaders() },
    );
  }

  // Create a ReadableStream that runs the search and emits SSE events
  const stream = new ReadableStream({
    async start(controller) {
      // emit is the write function passed into the search service
      const emit: EmitFn = (event: SSEEvent) => {
        try {
          controller.enqueue(encodeEvent(event));
        } catch {
          // Controller may already be closed if client disconnected
        }
      };

      try {
        await markTripSearching(trip.id);
        const services = await getTripServices(trip.id);
        await runSearch(trip, services, emit);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Search failed";
        console.error("[SSE stream] Unhandled error:", message);
        emit({ event: "error", message });
      } finally {
        // GUARANTEE: done is always the last event
        emit({ event: "done" });
        try {
          controller.close();
        } catch {
          // Already closed
        }
      }
    },
  });

  return new Response(stream, { headers: sseHeaders() });
}
