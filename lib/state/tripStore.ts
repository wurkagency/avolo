import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  type TripDraft,
  type TripDestination,
  type ServiceType,
  type Flexibility,
  defaultTripDraft,
} from "@/types/trip";

interface TripActions {
  setDeparture: (v: TripDestination | null) => void;
  setDestination: (v: TripDestination | null) => void;
  toggleService: (s: ServiceType) => void;
  setServices: (services: ServiceType[]) => void;
  setDates: (departureDate: string, returnDate: string | null, isOneWay: boolean) => void;
  setFlexibility: (f: Flexibility) => void;
  setTravelers: (adults: number, children: number[], hasDisability: boolean) => void;
  setLuggage: (handLuggage: number, checkedLuggage: number, specialLuggage: boolean) => void;
  reset: () => void;
}

export type TripStore = TripDraft & TripActions;

export const useTripStore = create<TripStore>()(
  persist(
    (set) => ({
      ...defaultTripDraft,

      setDeparture: (v) => set({ departure: v }),

      setDestination: (v) => set({ destination: v }),

      toggleService: (s) =>
        set((state) => {
          const exists = state.services.includes(s);
          if (exists) {
            // At least one service must remain selected
            const next = state.services.filter((svc) => svc !== s);
            return { services: next.length > 0 ? next : state.services };
          }
          return { services: [...state.services, s] };
        }),

      setServices: (services) =>
        set({ services: services.length > 0 ? services : defaultTripDraft.services }),

      setDates: (departureDate, returnDate, isOneWay) =>
        set({ departureDate, returnDate: isOneWay ? null : returnDate, isOneWay }),

      setFlexibility: (flexibility) => set({ flexibility }),

      setTravelers: (adults, children, hasDisability) =>
        set({ adults, children, hasDisability }),

      setLuggage: (handLuggage, checkedLuggage, specialLuggage) =>
        set({ handLuggage, checkedLuggage, specialLuggage }),

      reset: () => set(defaultTripDraft),
    }),
    {
      name: "avolo-trip-draft",
      storage: createJSONStorage(() => {
        // Guard: localStorage is not available during SSR
        if (typeof window === "undefined") {
          return {
            getItem: () => null,
            setItem: () => undefined,
            removeItem: () => undefined,
          };
        }
        return localStorage;
      }),
      // Only persist the data fields, not actions
      partialize: (state) => ({
        departure: state.departure,
        destination: state.destination,
        services: state.services,
        departureDate: state.departureDate,
        returnDate: state.returnDate,
        isOneWay: state.isOneWay,
        flexibility: state.flexibility,
        adults: state.adults,
        children: state.children,
        hasDisability: state.hasDisability,
        handLuggage: state.handLuggage,
        checkedLuggage: state.checkedLuggage,
        specialLuggage: state.specialLuggage,
      }),
    },
  ),
);

// Selector helpers — prevent unnecessary re-renders by selecting only needed slices
export const selectDeparture = (s: TripStore) => s.departure;
export const selectDestination = (s: TripStore) => s.destination;
export const selectServices = (s: TripStore) => s.services;
export const selectDates = (s: TripStore) => ({
  departureDate: s.departureDate,
  returnDate: s.returnDate,
  isOneWay: s.isOneWay,
  flexibility: s.flexibility,
});
export const selectTravelers = (s: TripStore) => ({
  adults: s.adults,
  children: s.children,
  hasDisability: s.hasDisability,
});
export const selectLuggage = (s: TripStore) => ({
  handLuggage: s.handLuggage,
  checkedLuggage: s.checkedLuggage,
  specialLuggage: s.specialLuggage,
});
