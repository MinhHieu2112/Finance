import { Currency } from '../modules/types/Transactions';

// Tỷ giá hối đoái cố định (VND là đồng tiền cơ sở)
// Trong thực tế, các tỷ giá này nên được lấy từ một API bên ngoài.
const EXCHANGE_RATES: Record<Currency, number> = {
  [Currency.VND]: 1,
  [Currency.USD]: 25450,
  [Currency.EUR]: 27600,
  [Currency.JPY]: 165,
  [Currency.GBP]: 32200,
};

/**
 * Chuyển đổi một số tiền từ đơn vị tiền tệ bất kỳ sang đơn vị tiền tệ cơ sở (VND).
 */
export const convertToBase = (amount: number, currency: Currency): number => {
  // Thực hiện nhân số tiền với tỷ giá tương ứng của đơn vị tiền tệ đó.
  const rate = EXCHANGE_RATES[currency] || EXCHANGE_RATES[Currency.VND];
  return amount * rate;
};
