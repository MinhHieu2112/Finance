import { z } from "zod";
// import { ca } from "zod/v4/locales";

const amountSchema = z.preprocess((val) => {
  if (typeof val === "number") return val;
  if (typeof val === "string") {
    const clean = val.toLowerCase().replace(/,/g, "");
    if (clean.endsWith("k")) return parseFloat(clean) * 1000;
    if (clean.endsWith("tr") || clean.endsWith("cu")) return parseFloat(clean) * 1000000;
    return parseFloat(clean);
  }
  return val;
}, z.number());

const TransactionDetailSchema = z.object({
  categoryName: z.string().trim(),
  quantity: z.number().int().min(1),
  amount: amountSchema,
  note: z.string().trim().optional(),
});

const TransactionSchema = z.object({
  description: z.string().trim(),
  total_amount: z.coerce.number(),
  type: z.enum(["income", "expense"]),
  // category: z.string().trim(),
  frequency: z.enum(["weekly", "monthly", "yearly", "one-time"]),
  date: z.coerce.date(),
  details: z.array(TransactionDetailSchema)
});

const TimePeriodSchema = z.object({
  year: z.number().int(),
  months: z.array(z.number().min(1).max(12)),
});

const QuerySchema = z.object({
  type: z.enum(["income", "expense"]),
  category_keywords: z.array(z.string()),
  time: z.array(TimePeriodSchema),
});

export const FinanceIntentSchema = z.discriminatedUnion("intent", [
  z.object({
    intent: z.literal("add"),
    transactions: z.array(TransactionSchema),
    query: z.null(),
  }),
  z.object({
    intent: z.literal("query"),
    transactions: z.null(),
    query: QuerySchema,
  }),
]);
