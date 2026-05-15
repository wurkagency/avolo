"use client";

import { useRouter } from "next/navigation";
import {
  useTripStore,
  selectDates,
} from "@/lib/state/tripStore";
import { DatePicker } from "@/components/explore/DatePicker";
import { StepWrapper } from "@/components/explore/StepWrapper";

export default function ExploreStep3Page() {
  const router = useRouter();
  const { departureDate, returnDate, isOneWay, flexibility } = useTripStore(selectDates);
  const setDates = useTripStore((s) => s.setDates);
  const setFlexibility = useTripStore((s) => s.setFlexibility);

  const canProceed = departureDate !== null && (isOneWay || returnDate !== null);

  return (
    <StepWrapper
      step={3}
      totalSteps={5}
      title="When are you going?"
      subtitle={isOneWay ? "Pick your departure date." : "Pick your departure and return dates."}
      onBack={() => router.push("/explore/services")}
      onNext={() => router.push("/explore/travelers")}
      nextDisabled={!canProceed}
    >
      <DatePicker
        departureDate={departureDate}
        returnDate={returnDate}
        isOneWay={isOneWay}
        flexibility={flexibility}
        onChangeDates={setDates}
        onChangeFlexibility={setFlexibility}
      />
    </StepWrapper>
  );
}
