"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useShallow } from "zustand/react/shallow";
import { useTripStore, selectLuggage } from "@/lib/state/tripStore";
import { LuggageSelector } from "@/components/explore/LuggageSelector";
import { StepWrapper } from "@/components/explore/StepWrapper";
import { createSearch } from "@/lib/api/searchClient";
import type { SearchRequest } from "@/types/search";

export default function ExploreStep5Page() {
  const router = useRouter();
  const { handLuggage, checkedLuggage, specialLuggage } = useTripStore(useShallow(selectLuggage));
  const setLuggage = useTripStore((s) => s.setLuggage);
  const tripState = useTripStore((s) => s);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleSubmit() {
    const { departure, destination, services, departureDate, returnDate, isOneWay, flexibility, adults, children, hasDisability } = tripState;

    if (!departure || !destination || !departureDate) {
      router.push("/explore");
      return;
    }

    const req: SearchRequest = {
      departure: departure.iata,
      departureName: departure.name,
      destination: destination.iata,
      destinationName: destination.name,
      ...(departure.nearbyIatas?.length ? { departureAirports: [departure.iata, ...departure.nearbyIatas] } : {}),
      ...(destination.nearbyIatas?.length ? { destinationAirports: [destination.iata, ...destination.nearbyIatas] } : {}),
      services,
      departureDate,
      returnDate: isOneWay ? null : (returnDate ?? null),
      isOneWay,
      flexibility,
      adults,
      children,
      hasDisability,
      handLuggage,
      checkedLuggage,
      specialLuggage,
    };

    setSubmitting(true);
    setSubmitError(null);

    try {
      const { tripId } = await createSearch(req);
      router.push(`/results?tripId=${encodeURIComponent(tripId)}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Search failed — please try again");
      setSubmitting(false);
    }
  }

  return (
    <StepWrapper
      step={5}
      totalSteps={5}
      title="Will you bring luggage?"
      subtitle="Tell us what you're bringing so we can filter fares accurately."
      onBack={() => router.push("/explore/travelers")}
      isLast
      onSubmit={handleSubmit}
      submitLabel={submitting ? "Searching…" : "Search trips"}
      submitDisabled={submitting}
    >
      <LuggageSelector
        handLuggage={handLuggage}
        checkedLuggage={checkedLuggage}
        specialLuggage={specialLuggage}
        onChangeHand={(n) => setLuggage(n, checkedLuggage, specialLuggage)}
        onChangeChecked={(n) => setLuggage(handLuggage, n, specialLuggage)}
        onChangeSpecial={(v) => setLuggage(handLuggage, checkedLuggage, v)}
      />
      {submitError && (
        <p className="mt-3 text-sm text-error">{submitError}</p>
      )}
    </StepWrapper>
  );
}
