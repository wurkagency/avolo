"use client";

import { useRouter } from "next/navigation";
import { useTripStore, selectDeparture, selectDestination } from "@/lib/state/tripStore";
import { AutocompleteInput } from "@/components/explore/AutocompleteInput";
import { MicButton } from "@/components/explore/MicButton";
import { StepWrapper } from "@/components/explore/StepWrapper";

export default function ExploreStep1Page() {
  const router = useRouter();

  const departure = useTripStore(selectDeparture);
  const destination = useTripStore(selectDestination);
  const setDeparture = useTripStore((s) => s.setDeparture);
  const setDestination = useTripStore((s) => s.setDestination);

  const canProceed = departure !== null && destination !== null;

  function handleMicTranscript(text: string) {
    const lower = text.toLowerCase();
    const toMatch = lower.match(/^(.+?)\s+to\s+(.+)$/);
    const fromMatch = lower.match(/^from\s+(.+?)\s+to\s+(.+)$/);
    if (fromMatch) void fromMatch;
    else if (toMatch) void toMatch;
  }

  return (
    <StepWrapper
      step={1}
      totalSteps={5}
      title="Where are you flying?"
      subtitle="Choose your departure city and destination."
      onNext={() => router.push("/explore/services")}
      nextDisabled={!canProceed}
    >
      <div className="flex flex-col gap-4">
        <AutocompleteInput
          label="From"
          placeholder="Departure city or airport"
          value={departure}
          onChange={setDeparture}
          onEnter={() => canProceed && router.push("/explore/services")}
          autoFocus
        />
        <AutocompleteInput
          label="To"
          placeholder="Destination city or airport"
          value={destination}
          onChange={setDestination}
          onEnter={() => canProceed && router.push("/explore/services")}
        />
        <div className="pt-1">
          <MicButton onTranscript={handleMicTranscript} />
        </div>
      </div>
    </StepWrapper>
  );
}
