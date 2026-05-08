export enum Currency {
  VND = 'VND',
  USD = 'USD',
  EUR = 'EUR',
  JPY = 'JPY',
  GBP = 'GBP',
}

export const CURRENCY_METADATA: Record<Currency, { symbol: string; locale: string }> = {
  [Currency.VND]: { symbol: '₫', locale: 'vi-VN' },
  [Currency.USD]: { symbol: '$', locale: 'en-US' },
  [Currency.EUR]: { symbol: '€', locale: 'de-DE' },
  [Currency.JPY]: { symbol: '¥', locale: 'ja-JP' },
  [Currency.GBP]: { symbol: '£', locale: 'en-GB' },
};

/**
 * Formats a number as a currency string based on the provided currency type.
 * @param amount The numerical amount to format.
 * @param currency The currency type (VND, USD, etc.).
 * @returns A formatted currency string.
 */
export const formatCurrency = (amount: number, currency: Currency = Currency.VND): string => {
  const metadata = CURRENCY_METADATA[currency] || CURRENCY_METADATA[Currency.VND];
  
  try {
    return new Intl.NumberFormat(metadata.locale, {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: currency === Currency.VND ? 0 : 2,
    }).format(amount);
  } catch (e) {
    // Fallback if Intl fails
    return `${amount.toLocaleString()} ${metadata.symbol}`;
  }
};
