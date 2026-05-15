import { z } from 'zod';

export const walletActionSchema = z.object({
  amount: z
    .number({
      required_error: 'Amount is required',
      invalid_type_error: 'Amount must be a number',
    })
    .positive('Amount must be a positive number')
    .refine(
      (val) => parseFloat(val.toFixed(2)) === val,
      { message: 'Amount cannot have more than 2 decimal places' }
    ),
  description: z.string().max(255).optional().transform((val) => val?.trim()),
});

export type WalletActionInput = z.infer<typeof walletActionSchema>;
