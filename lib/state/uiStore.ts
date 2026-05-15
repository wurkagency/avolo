import { create } from "zustand";
import type { ToastItem, ToastType } from "@/components/ui/Toast";

let toastCounter = 0;

interface UiState {
  toasts: ToastItem[];
  isSearching: boolean;
  addToast: (message: string, type: ToastType) => void;
  dismissToast: (id: string) => void;
  setSearching: (v: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  toasts: [],
  isSearching: false,

  addToast: (message, type) => {
    const id = `toast-${++toastCounter}`;
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
  },

  dismissToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },

  setSearching: (v) => set({ isSearching: v }),
}));
