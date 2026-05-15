"use client";

import { useRouter } from "next/navigation";
import { useTripStore, selectServices } from "@/lib/state/tripStore";
import { ServiceCheckbox } from "@/components/explore/ServiceCheckbox";
import { StepWrapper } from "@/components/explore/StepWrapper";
import type { ServiceType } from "@/types/trip";

export default function ExploreStep2Page() {
  const router = useRouter();
  const services = useTripStore(selectServices);
  const setServices = useTripStore((s) => s.setServices);

  return (
    <StepWrapper
      step={2}
      totalSteps={5}
      title="What do you need?"
      subtitle="Select everything you'd like to book."
      onBack={() => router.push("/explore")}
      onNext={() => router.push("/explore/dates")}
      nextDisabled={services.length === 0}
    >
      <ServiceCheckbox
        selected={services}
        onChange={(s: ServiceType[]) => setServices(s)}
      />
    </StepWrapper>
  );
}
