import { z } from 'zod';
import { NIFTY_50_SET } from '@/constants/nifty50';

export const tradeSchema = z.object({
  symbol: z
    .string({ required_error: 'Stock symbol is required' })
    .min(1, 'Stock symbol is required')
    .max(20, 'Symbol must not exceed 20 characters')
    .transform((val) => val.toUpperCase().trim())
    .refine((val) => NIFTY_50_SET.has(val), {
      message: 'Trading is restricted to Nifty 50 symbols only.',
    }),

  quantity: z
    .number({
      required_error: 'Quantity is required',
      invalid_type_error: 'Quantity must be a number',
    })
    .int('Quantity must be a whole number')
    .positive('Quantity must be greater than 0'),

  price: z
    .number({
      required_error: 'Price is required',
      invalid_type_error: 'Price must be a number',
    })
    .positive('Price must be greater than 0'),
});

export type TradeInput = z.infer<typeof tradeSchema>;
