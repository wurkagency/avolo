"use client";

import { useRouter } from "next/navigation";
import { useTripStore, selectDeparture, selectDestination } from "@/lib/state/tripStore";
import { AutocompleteInput } from "@/components/explore/AutocompleteInput";
import { MicButton } from "@/components/explore/MicButton";

export function HomeSearch() {
  const router = useRouter();

  const departure = useTripStore(selectDeparture);
  const destination = useTripStore(selectDestination);
  const setDeparture = useTripStore((s) => s.setDeparture);
  const setDestination = useTripStore((s) => s.setDestination);

  function proceed() {
    if (departure && destination) {
      router.push("/explore/services");
    } else {
      router.push("/explore");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <AutocompleteInput
        label="From"
        placeholder="Departure city or airport"
        value={departure}
        onChange={setDeparture}
        onEnter={proceed}
      />
      <AutocompleteInput
        label="To"
        placeholder="Destination city or airport"
        value={destination}
        onChange={setDestination}
        onEnter={proceed}
      />
      <div className="flex items-center justify-between gap-4 pt-1">
        <MicButton />
        <button
          type="button"
          onClick={proceed}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-xl hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          style={{ fontFamily: "var(--font-inter)", fontSize: "15px", fontWeight: 700 }}
        >
          Plan trip
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">arrow_forward</span>
        </button>
      </div>
    </div>
  );
}
