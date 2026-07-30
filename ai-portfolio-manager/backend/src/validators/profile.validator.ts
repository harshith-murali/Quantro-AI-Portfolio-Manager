import { z } from 'zod';

export const financialProfileSchema = z.object({
  monthlyIncome: z
    .number({
      required_error: 'Monthly income is required',
      invalid_type_error: 'Monthly income must be a number',
    })
    .nonnegative('Monthly income must be greater than or equal to 0'),

  monthlyExpenses: z
    .number({
      required_error: 'Monthly expenses are required',
      invalid_type_error: 'Monthly expenses must be a number',
    })
    .nonnegative('Monthly expenses must be greater than or equal to 0'),

  currentSavings: z
    .number({
      required_error: 'Current savings is required',
      invalid_type_error: 'Current savings must be a number',
    })
    .nonnegative('Current savings must be greater than or equal to 0'),

  financialGoal: z
    .string()
    .max(500, 'Financial goal must not exceed 500 characters')
    .optional()
    .nullable(),

  riskAppetite: z
    .string({
      required_error: 'Risk appetite is required',
    })
    .transform((val) => val.toUpperCase())
    .pipe(z.enum(['LOW', 'MEDIUM', 'HIGH'], {
      errorMap: () => ({ message: 'Risk appetite must be low, medium, or high' }),
    })),
});

// Type inferred from schema
export type FinancialProfileInput = z.infer<typeof financialProfileSchema>;
