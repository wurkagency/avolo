import type { TripDraft } from "@/types/trip";

/**
 * Returns the URL of the first wizard step that still needs user input,
 * reading from the merged store state (persisted + AI output) so returning
 * users don't re-enter fields they already have.
 *
 * `filled` is the Set of fields the AI explicitly resolved on the last call;
 * it distinguishes "AI set services" from "services has its default value".
 */
export function nextMissingStep(store: TripDraft, filled: Set<keyof TripDraft>): string {
  // Step 1 — destinations: both airports must be present
  if (!store.departure || !store.destination) return "/explore";

  // Step 2 — services: skip only when AI explicitly resolved them
  if (!filled.has("services")) return "/explore/services";

  // Step 3 — dates: departure date required; round-trips also need a return date
  const datesComplete = store.departureDate && (store.isOneWay || store.returnDate);
  if (!datesComplete) return "/explore/dates";

  // Step 4 — travelers: skip when AI set a non-default party
  const hasExplicitTravelers = store.adults > 1 || store.children.length > 0;
  if (!hasExplicitTravelers) return "/explore/travelers";

  // Step 5 — luggage: final confirmation gate before search
  return "/explore/luggage";
}
