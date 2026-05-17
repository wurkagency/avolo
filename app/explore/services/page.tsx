"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTripStore, selectServices } from "@/lib/state/tripStore";
import { ServiceCheckbox } from "@/components/explore/ServiceCheckbox";
import { StepWrapper } from "@/components/explore/StepWrapper";
import type { ServiceType } from "@/types/trip";

function buildConfirmation(departure: string | null, destination: string | null): string {
  if (departure && destination) {
    return `I'll help you plan your trip from ${departure} to ${destination}. What would you like to book?`;
  }
  if (destination) {
    return `I'll help you find options for ${destination}. What would you like to book?`;
  }
  return "Let's plan your trip. What would you like to book?";
}

function StreamingConfirmation({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    setDisplayed("");
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, 20);
    return () => clearInterval(id);
  }, [text]);

  return (
    <div
      style={{
        fontFamily: "var(--font-inter)",
        fontSize: "16px",
        lineHeight: "1.6",
        color: "var(--color-ink)",
        padding: "var(--spacing-md) var(--spacing-lg)",
        backgroundColor: "var(--color-canvas)",
        border: "1px solid var(--color-hairline-soft)",
        borderRadius: "var(--rounded-lg)",
        minHeight: 52,
      }}
    >
      {displayed}
      {displayed.length < text.length && (
        <span
          aria-hidden="true"
          style={{ display: "inline-block", width: 2, height: "1em", backgroundColor: "var(--color-primary)", marginLeft: 2, verticalAlign: "text-bottom", animation: "cursor-blink 0.8s ease-in-out infinite" }}
        />
      )}
    </div>
  );
}

export default function ExploreStep2Page() {
  const router       = useRouter();
  const services     = useTripStore(selectServices);
  const setServices  = useTripStore((s) => s.setServices);
  const departure    = useTripStore((s) => s.departure?.name ?? null);
  const destination  = useTripStore((s) => s.destination?.name ?? null);

  const confirmationText = buildConfirmation(departure, destination);

  return (
    <StepWrapper
      step={2}
      totalSteps={5}
      title="How do you want to travel?"
      onBack={() => router.push("/explore")}
      onNext={() => router.push("/explore/dates")}
      nextDisabled={services.length === 0}
    >
      <StreamingConfirmation text={confirmationText} />

      <ServiceCheckbox
        selected={services}
        onChange={(s: ServiceType[]) => setServices(s)}
      />

      <style>{`
        @keyframes cursor-blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
      `}</style>
    </StepWrapper>
  );
}
