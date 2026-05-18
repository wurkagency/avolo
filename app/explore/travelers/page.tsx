"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useShallow } from "zustand/react/shallow";
import { useTripStore, selectTravelers, selectLuggage } from "@/lib/state/tripStore";
import { TravelerCounter } from "@/components/explore/TravelerCounter";
import { StepWrapper } from "@/components/explore/StepWrapper";
import { createSearch } from "@/lib/api/searchClient";
import type { SearchRequest } from "@/types/search";

export default function ExploreStep4Page() {
  const router = useRouter();
  const { adults, children, hasDisability } = useTripStore(useShallow(selectTravelers));
  const { handLuggage, checkedLuggage, specialLuggage } = useTripStore(useShallow(selectLuggage));
  const setTravelers = useTripStore((s) => s.setTravelers);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleManualSubmit() {
    const store = useTripStore.getState();
    const { departure, destination, services, departureDate, returnDate, isOneWay, flexibility, hasDisability: dis } = store;

    if (!departure || !destination || !departureDate) {
      router.push("/explore/confirm");
      return;
    }

    const req: SearchRequest = {
      departure:     departure.iata,
      departureName: departure.name,
      destination:   destination.iata,
      destinationName: destination.name,
      ...(departure.nearbyIatas?.length  ? { departureAirports:   [departure.iata,  ...departure.nearbyIatas]  } : {}),
      ...(destination.nearbyIatas?.length ? { destinationAirports: [destination.iata, ...destination.nearbyIatas] } : {}),
      services,
      departureDate,
      returnDate: isOneWay ? null : (returnDate ?? null),
      isOneWay,
      flexibility,
      adults,
      children,
      hasDisability: dis,
      handLuggage,
      checkedLuggage,
      specialLuggage,
    };

    setSubmitting(true);
    setSubmitError(null);

    // Clear the manual fill flag
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("avolo_manual_fill");
    }

    try {
      const { tripId } = await createSearch(req);
      router.push(`/results?tripId=${encodeURIComponent(tripId)}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Search failed — please try again");
      setSubmitting(false);
    }
  }

  const isManualFill =
    typeof window !== "undefined" && !!sessionStorage.getItem("avolo_manual_fill");

  return (
    <StepWrapper
      step={4}
      totalSteps={5}
      title="Who will be traveling?"
      subtitle="Add all passengers, including children."
      onBack={() => router.push("/explore/dates")}
      {...(isManualFill
        ? {
            isLast: true,
            onSubmit: () => void handleManualSubmit(),
            submitLabel: submitting ? "Searching…" : "Search trips",
            submitDisabled: submitting,
          }
        : { onNext: () => router.push("/explore/luggage") })}
    >
      <TravelerCounter
        adults={adults}
        childAges={children}
        hasDisability={hasDisability}
        onChangeAdults={(n) => setTravelers(n, children, hasDisability)}
        onChangeChildren={(ages) => setTravelers(adults, ages, hasDisability)}
        onChangeDisability={(v) => setTravelers(adults, children, v)}
      />
      {submitError && (
        <p style={{ color: "var(--color-error, #c0392b)", fontSize: 13, marginTop: 8, fontFamily: "var(--font-inter)" }}>
          {submitError}
        </p>
      )}
    </StepWrapper>
  );
}
