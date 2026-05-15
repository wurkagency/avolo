"use client";

import { useUserStore } from "@/lib/state/userStore";
import { formatInCurrency } from "@/lib/utils/currency";

/**
 * Returns a stable `format` function that converts a EUR price to the
 * user's preferred display currency. Re-renders when currency changes.
 */
export function useCurrency() {
  const currency = useUserStore((s) => s.currency);
  return {
    currency,
    format: (priceEur: number) => formatInCurrency(priceEur, currency),
  };
}
