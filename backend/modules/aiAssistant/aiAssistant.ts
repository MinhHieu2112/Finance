export type AITransactionType = 'income' | 'expense' | 'debt' | 'savings';
export type AITransactionFrequency = 'weekly' | 'monthly' | 'yearly' | 'one-time';

// Giao diện dữ liệu chi tiết của một mặt hàng trong giao dịch
export interface AIDetailInput {
  categoryName: string;
  quantity: number;
  amount: number;
  name: string;
}

import { Currency } from '../types/Transactions';

// Giao diện đầu vào cho một giao dịch do AI phân tích
export interface AITransactionInput {
  description: string;
  type: AITransactionType;
  frequency: AITransactionFrequency;
  currency?: Currency;
  date: Date;
  details: AIDetailInput[];
}

// Giao diện định nghĩa khoảng thời gian truy vấn dữ liệu
export interface AIQueryTimeInput {
  year: number;
  months: number[];
}

// Giao diện đầu vào cho các yêu cầu truy vấn/tìm kiếm của AI
export interface AIQueryInput {
  type: AITransactionType;
  category_keywords: string[];
  time: AIQueryTimeInput[];
}

// Giao diện bao quát ý định của người dùng (Thêm mới hoặc Truy vấn)
export interface AIIntentPayload {
  intent: 'add' | 'query';
  data: AITransactionInput[] | AIQueryInput;
}

// Kết quả trả về sau khi phân tích ý định người dùng
export interface AIIntentResult {
  intent: 'add' | 'query';
  data: unknown;
}
