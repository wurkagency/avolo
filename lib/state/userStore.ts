import { create } from "zustand";
import { persist } from "zustand/middleware";

type Currency = "EUR" | "USD" | "GBP" | "DKK" | "SEK" | "NOK";
type Language = "EN" | "DE" | "DA" | "SV" | "NO";

interface UserState {
  currency: Currency;
  language: Language;
  setCurrency: (c: Currency) => void;
  setLanguage: (l: Language) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      currency: "EUR",
      language: "EN",
      setCurrency: (c) => set({ currency: c }),
      setLanguage: (l) => set({ language: l }),
    }),
    { name: "avolo-user-prefs" },
  ),
);
