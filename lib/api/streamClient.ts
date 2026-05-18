"use client";

// useSSEStream — React hook that connects to GET /api/search/stream?tripId=<id>
// and delivers typed SSE events to the component.

import { useState, useEffect, useRef } from "react";
import type { NormalizedResult, SSEEvent } from "@/types/search";
import type { ServiceType } from "@/types/trip";

export interface SSEStreamState {
  status: string;
  results: Partial<Record<ServiceType, NormalizedResult[]>>;
  isDone: boolean;
  error: string | null;
  allProvidersFailed: boolean;
  aiErrors: string[];
}

export function useSSEStream(tripId: string | null): SSEStreamState {
  const [status, setStatus] = useState<string>("Connecting…");
  const [results, setResults] = useState<Partial<Record<ServiceType, NormalizedResult[]>>>({});
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allProvidersFailed, setAllProvidersFailed] = useState(false);
  const [aiErrors, setAiErrors] = useState<string[]>([]);

  const esRef = useRef<EventSource | null>(null);
  // Ref tracks completion so onerror closure doesn't read stale state
  const isDoneRef = useRef(false);

  useEffect(() => {
    if (!tripId) return;

    esRef.current?.close();
    isDoneRef.current = false;

    setStatus("Connecting…");
    setResults({});
    setIsDone(false);
    setError(null);
    setAllProvidersFailed(false);
    setAiErrors([]);

    const es = new EventSource(`/api/search/stream?tripId=${encodeURIComponent(tripId)}`);
    esRef.current = es;

    es.onmessage = (e: MessageEvent<string>) => {
      let parsed: SSEEvent;
      try {
        parsed = JSON.parse(e.data) as SSEEvent;
      } catch {
        console.error("[SSE] Failed to parse event:", e.data);
        return;
      }

      switch (parsed.event) {
        case "status":
          setStatus(parsed.message);
          break;

        case "category":
          setResults((prev) => ({ ...prev, [parsed.type]: parsed.results }));
          if (parsed.error) {
            console.warn(`[SSE] Category ${parsed.type} error:`, parsed.error);
          }
          break;

        case "all_providers_failed":
          setAllProvidersFailed(true);
          break;

        case "ai_error":
          setAiErrors((prev) => {
            const merged = prev.concat(parsed.providers);
            return merged.filter((p, i) => merged.indexOf(p) === i);
          });
          break;

        case "done":
          isDoneRef.current = true;
          setIsDone(true);
          setStatus("Search complete");
          es.close();
          break;

        case "error":
          setError(parsed.message);
          break;
      }
    };

    es.onerror = () => {
      // Use ref to avoid stale closure — isDoneRef reflects current completion state
      if (!isDoneRef.current) {
        setError("Connection lost — please refresh to retry");
        setIsDone(true);
        isDoneRef.current = true;
      }
      es.close();
    };

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [tripId]);

  return { status, results, isDone, error, allProvidersFailed, aiErrors };
}
