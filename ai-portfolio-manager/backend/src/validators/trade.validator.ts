import { z } from 'zod';
import { normalizeSupportedSymbol } from '@/utils/symbol';

export const tradeSchema = z.object({
  symbol: z
    .string({ required_error: 'Stock symbol is required' })
    .min(1, 'Stock symbol is required')
    .max(20, 'Symbol must not exceed 20 characters')
    .transform((val) => normalizeSupportedSymbol(val)),

  quantity: z
    .number({
      required_error: 'Quantity is required',
      invalid_type_error: 'Quantity must be a number',
    })
    .int('Quantity must be a whole number')
    .positive('Quantity must be greater than 0'),

}).strict();

export type TradeInput = z.infer<typeof tradeSchema>;
