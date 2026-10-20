import { z } from "zod";
const day = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (value) =>
      !Number.isNaN(Date.parse(value)) &&
      new Date(value).toISOString().slice(0, 10) === value,
    "Invalid date",
  );
export const backtestSchema = z
  .object({
    symbol: z.string().min(1).max(20),
    shortWindow: z.coerce.number().int().min(2).max(200).default(20),
    longWindow: z.coerce.number().int().min(3).max(250).default(50),
    initialCapital: z.coerce
      .number()
      .min(100)
      .max(1_000_000_000)
      .default(100000),
    positionSize: z.coerce.number().min(1).max(100).default(10),
    transactionCostPct: z.coerce.number().min(0).max(5).default(0.1),
    slippagePct: z.coerce.number().min(0).max(5).default(0.05),
    startDate: day.optional(),
    endDate: day.optional(),
  })
  .refine(
    (value) => value.shortWindow < value.longWindow,
    "Short window must be less than long window",
  )
  .refine(
    (value) =>
      !value.startDate || !value.endDate || value.startDate < value.endDate,
    "Start date must precede end date",
  )
  .refine(
    (value) =>
      !value.endDate || value.endDate <= new Date().toISOString().slice(0, 10),
    "End date cannot be in the future",
  );
