import { z } from 'zod';
import { NIFTY_50_SET } from '@/constants/nifty50';

export const askInsightSchema = z.object({
  question: z
    .string({ required_error: 'Question is required' })
    .min(5, 'Question must be at least 5 characters long')
    .max(500, 'Question cannot exceed 500 characters')
    .trim(),
});

export const stockInsightSchema = z.object({
  symbol: z
    .string({ required_error: 'Stock symbol is required' })
    .transform((val) => val.toUpperCase().trim())
    .refine((val) => NIFTY_50_SET.has(val), {
      message: 'Insights are currently restricted to Nifty 50 symbols only.',
    }),
});
