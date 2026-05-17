import Link from "next/link";

export function EmptyTrips() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-6 text-center">
      <span
        className="material-symbols-outlined text-steel"
        style={{ fontSize: "64px", fontVariationSettings: "'FILL' 0, 'wght' 200" }}
        aria-hidden="true"
      >
        flight_takeoff
      </span>
      <div className="flex flex-col gap-2">
        <h2
          className="text-ink"
          style={{ fontFamily: "var(--font-editorial)", fontSize: "28px", fontWeight: 700 }}
        >
          No trips yet
        </h2>
        <p className="text-steel text-base max-w-xs mx-auto">
          Plan your first trip and discover flights, hotels, cars, and experiences — all ranked by AI.
        </p>
      </div>
      <Link
        href="/explore"
        className="rounded-md bg-primary px-8 py-3 text-sm font-semibold text-white hover:bg-primary-deep transition-colors"
      >
        Plan a trip
      </Link>
    </div>
  );
}
