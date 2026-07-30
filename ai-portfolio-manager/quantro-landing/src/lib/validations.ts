import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const registerSchema = loginSchema.extend({
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const profileSchema = z.object({
  monthlyIncome: z.number().min(1000, "Minimum income is ₹1,000"),
  fixedExpenses: z.number().min(0),
  discretionaryExpenses: z.number().min(0),
  totalSavings: z.number().min(0),
  financialGoal: z.string().max(500).optional().nullable(),
  riskAppetite: z.enum(["LOW", "MEDIUM", "HIGH"]),
}).refine(
  (d) => d.monthlyIncome > (d.fixedExpenses + d.discretionaryExpenses),
  { message: "Expenses cannot exceed income", path: ["fixedExpenses"] }
);

export const tradeSchema = z.object({
  symbol: z.string().min(1),
  type: z.enum(["BUY", "SELL"]),
  quantity: z.number().int().positive("Quantity must be a positive integer"),
});

export const backtestSchema = z.object({
  symbol: z.string().min(1, "Select a symbol"),
  strategy: z.enum(["SMA_CROSSOVER"]),
  dateFrom: z.string().min(1, "Select start date"),
  dateTo: z.string().min(1, "Select end date"),
  initialCapital: z.number().min(10000, "Minimum capital is ₹10,000"),
  positionSize: z.number().min(1).max(100),
  shortWindow: z.number().min(1),
  longWindow: z.number().min(1),
}).refine((d) => new Date(d.dateTo) > new Date(d.dateFrom), {
  message: "End date must be after start date",
  path: ["dateTo"],
}).refine((d) => d.shortWindow < d.longWindow, {
  message: "Short window must be less than long window",
  path: ["shortWindow"],
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type TradeInput = z.infer<typeof tradeSchema>;
export type BacktestInput = z.infer<typeof backtestSchema>;
