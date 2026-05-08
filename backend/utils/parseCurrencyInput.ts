import { Currency } from '../modules/types/Transactions';

const CURRENCY_MATCHERS: Array<{ currency: Currency; pattern: RegExp }> = [
  { currency: Currency.USD, pattern: /(?:^|[^\p{L}])(?:usd|\$)(?:[^\p{L}]|$)/iu },
  { currency: Currency.EUR, pattern: /(?:^|[^\p{L}])(?:eur|€)(?:[^\p{L}]|$)/iu },
  { currency: Currency.JPY, pattern: /(?:^|[^\p{L}])(?:jpy|¥)(?:[^\p{L}]|$)/iu },
  { currency: Currency.GBP, pattern: /(?:^|[^\p{L}])(?:gbp|£)(?:[^\p{L}]|$)/iu },
  { currency: Currency.VND, pattern: /(?:^|[^\p{L}])(?:vnd|dong|d|đ|₫)(?:[^\p{L}]|$)/iu },
];

const CURRENCY_TOKEN_PATTERN = /(usd|\$|eur|€|jpy|¥|gbp|£|vnd|dong|đ|₫)/giu;

const normalizeNumericString = (value: string) => {
  const compactValue = value.replace(/\s+/g, '');
  const hasComma = compactValue.includes(',');
  const hasDot = compactValue.includes('.');

  if (hasComma && hasDot) {
    return compactValue.lastIndexOf(',') > compactValue.lastIndexOf('.')
      ? compactValue.replace(/\./g, '').replace(',', '.')
      : compactValue.replace(/,/g, '');
  }

  if (hasComma) {
    const parts = compactValue.split(',');
    return parts.length === 2 && parts[1].length <= 2
      ? `${parts[0]}.${parts[1]}`
      : parts.join('');
  }

  if (hasDot) {
    const parts = compactValue.split('.');
    return parts.length === 2 && parts[1].length <= 2
      ? compactValue
      : parts.join('');
  }

  return compactValue;
};

export const parseCurrencyInput = (rawValue: string | number | null | undefined) => {
  const normalizedValue = String(rawValue ?? '').trim();
  const detectedCurrency = CURRENCY_MATCHERS.find(({ pattern }) => pattern.test(normalizedValue))?.currency || null;

  if (!normalizedValue) {
    return {
      amount: null as number | null,
      detectedCurrency,
    };
  }

  const numericValue = normalizeNumericString(
    normalizedValue
      .replace(CURRENCY_TOKEN_PATTERN, '')
      .replace(/[^\d,.\-]/g, ''),
  );

  if (!numericValue || numericValue === '-' || numericValue === '.' || numericValue === '-.') {
    return {
      amount: null as number | null,
      detectedCurrency,
    };
  }

  const amount = Number.parseFloat(numericValue);
  return {
    amount: Number.isFinite(amount) ? amount : null,
    detectedCurrency,
  };
};
