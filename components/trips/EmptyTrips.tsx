import Link from "next/link";

export function EmptyTrips() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-6 text-center">
      <span
        className="material-symbols-outlined text-on-surface-variant"
        style={{ fontSize: "64px", fontVariationSettings: "'FILL' 0, 'wght' 200" }}
        aria-hidden="true"
      >
        flight_takeoff
      </span>
      <div className="flex flex-col gap-2">
        <h2
          className="text-on-surface"
          style={{ fontFamily: "var(--font-manrope)", fontSize: "28px", fontWeight: 700 }}
        >
          No trips yet
        </h2>
        <p className="text-on-surface-variant text-base max-w-xs mx-auto">
          Plan your first trip and discover flights, hotels, cars, and experiences — all ranked by AI.
        </p>
      </div>
      <Link
        href="/explore"
        className="rounded-full bg-primary px-8 py-3 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
      >
        Plan a trip
      </Link>
    </div>
  );
}
