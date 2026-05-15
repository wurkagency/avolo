// Static EUR conversion rates. Phase 7 uses these; Phase 10 can swap in live rates.
// Rates: 1 EUR = X of currency
export const EUR_RATES: Record<string, number> = {
  EUR: 1.0,
  USD: 1.08,
  GBP: 0.85,
  DKK: 7.46,
  SEK: 11.32,
  NOK: 11.65,
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: "€",
  USD: "$",
  GBP: "£",
  DKK: "kr",
  SEK: "kr",
  NOK: "kr",
};

const CURRENCY_LOCALES: Record<string, string> = {
  EUR: "de-DE",
  USD: "en-US",
  GBP: "en-GB",
  DKK: "da-DK",
  SEK: "sv-SE",
  NOK: "nb-NO",
};

/** Convert a EUR-denominated amount to the target currency. */
export function convertFromEur(amountEur: number, targetCurrency: string): number {
  const rate = EUR_RATES[targetCurrency] ?? 1;
  return amountEur * rate;
}

/** Format a EUR amount for display in the given currency. */
export function formatInCurrency(amountEur: number, currency: string): string {
  const converted = convertFromEur(amountEur, currency);
  const locale = CURRENCY_LOCALES[currency] ?? "en-US";

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(converted);
  } catch {
    // Fallback: symbol + rounded number
    return `${CURRENCY_SYMBOLS[currency] ?? currency}${Math.round(converted)}`;
  }
}
