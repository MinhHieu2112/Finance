import { z } from 'zod';

// export const amountSchema = z.preprocess((val) => {
//   if (typeof val === 'number') return val;
//   if (typeof val === 'string') {
//     const clean = val.toLowerCase().replace(/,/g, '');
//     if (clean.endsWith('k')) return parseFloat(clean) * 1000;
//     if (clean.endsWith('tr') || clean.endsWith('cu')) return parseFloat(clean) * 1000000;
//     return parseFloat(clean);
//   }
//   return val;
// }, z.number());

export const TransactionDetailSchema = z.object({
  categoryName: z.string().trim(),
  quantity: z.number().int().min(1),
  amount: z.number().min(0),
  name: z.string().trim(),
});

export const TransactionSchema = z.object({
  description: z.string().trim().default('No description'),
  type: z.enum(['income', 'expense']),
  frequency: z.enum(['weekly', 'monthly', 'yearly', 'one-time']),
  date: z.union([z.string(), z.date()]).transform(val => new Date(val)),
  details: z.array(TransactionDetailSchema)
});

export const FinancetSchema = z.object({
  transactions: z.array(TransactionSchema)
});

const TimePeriodSchema = z.object({
  year: z.number().int(),
  months: z.array(z.number().min(1).max(12)),
});

export const QuerySchema = z.object({
  type: z.enum(['income', 'expense']),
  category_keywords: z.array(z.string()),
  time: z.array(TimePeriodSchema),
});

// export const FinanceIntentSchema = z.discriminatedUnion('intent', [
//   z.object({
//     intent: z.literal('add'),
//     transactions: z.array(TransactionSchema),
//     query: z.null(),
//   }),
//   z.object({
//     intent: z.literal('query'),
//     transactions: z.null(),
//     query: QuerySchema,
//   }),
// ]);
