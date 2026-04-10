export type AITransactionType = 'income' | 'expense';
export type AITransactionFrequency = 'weekly' | 'monthly' | 'yearly' | 'one-time';

export interface AIDetailInput {
  categoryName: string;
  quantity?: number;
  amount?: number;
  name?: string;
}

export interface AITransactionInput {
  description?: string;
  type?: AITransactionType;
  frequency?: AITransactionFrequency;
  date?: string | Date;
  details: AIDetailInput[];
}

export interface AIQueryTimeInput {
  year: number;
  months: number[];
}

export interface AIQueryInput {
  type?: AITransactionType;
  category_keywords?: string[];
  time?: AIQueryTimeInput[];
}

export interface AIIntentPayload {
  intent?: 'add' | 'query';
  transactions?: AITransactionInput[];
  query?: AIQueryInput;
  data?: {
    transactions?: AITransactionInput[];
  } | AIQueryInput;
}

export interface AIIntentResult {
  intent: 'add' | 'query';
  data: unknown;
}
