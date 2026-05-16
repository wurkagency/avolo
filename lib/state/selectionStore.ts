"use client";

import { create } from "zustand";
import type { ServiceType } from "@/types/trip";

export interface SelectedItem {
  resultId: string;
  priceEur: number;
  summary: string;
}

type SelectionMap = Partial<Record<ServiceType, SelectedItem>>;

interface SelectionState {
  tripId: string | null;
  items: SelectionMap;
  setTripId: (id: string) => void;
  select: (type: ServiceType, item: SelectedItem) => void;
  deselect: (type: ServiceType) => void;
  isSelected: (type: ServiceType, resultId: string) => boolean;
  totalPrice: () => number;
  clear: () => void;
}

export const useSelectionStore = create<SelectionState>()((set, get) => ({
  tripId: null,
  items: {},

  setTripId: (id) => set({ tripId: id }),

  select: (type, item) =>
    set((s) => ({ items: { ...s.items, [type]: item } })),

  deselect: (type) =>
    set((s) => {
      const next = { ...s.items };
      delete next[type];
      return { items: next };
    }),

  isSelected: (type, resultId) => get().items[type]?.resultId === resultId,

  totalPrice: () =>
    Object.values(get().items).reduce((sum, item) => sum + (item?.priceEur ?? 0), 0),

  clear: () => set({ items: {} }),
}));
