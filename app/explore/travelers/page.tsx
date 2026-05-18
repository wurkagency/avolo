"use client";

import { useRouter } from "next/navigation";
import { useShallow } from "zustand/react/shallow";
import { useTripStore, selectTravelers } from "@/lib/state/tripStore";
import { TravelerCounter } from "@/components/explore/TravelerCounter";
import { StepWrapper } from "@/components/explore/StepWrapper";

export default function ExploreStep4Page() {
  const router = useRouter();
  const { adults, children, hasDisability } = useTripStore(useShallow(selectTravelers));
  const setTravelers = useTripStore((s) => s.setTravelers);

  return (
    <StepWrapper
      step={4}
      totalSteps={5}
      title="Who will be traveling?"
      subtitle="Add all passengers, including children."
      onBack={() => router.push("/explore/dates")}
      onNext={() => router.push("/explore/luggage")}
    >
      <TravelerCounter
        adults={adults}
        childAges={children}
        hasDisability={hasDisability}
        onChangeAdults={(n) => setTravelers(n, children, hasDisability)}
        onChangeChildren={(ages) => setTravelers(adults, ages, hasDisability)}
        onChangeDisability={(v) => setTravelers(adults, children, v)}
      />
    </StepWrapper>
  );
}
