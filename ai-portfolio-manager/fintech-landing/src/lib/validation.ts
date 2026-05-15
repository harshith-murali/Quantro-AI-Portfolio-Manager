import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const registerSchema = loginSchema.extend({
  name: z.string().min(2, "Name must be at least 2 characters"),
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
  investmentGoal: z.enum(["SHORT_TERM", "MEDIUM_TERM", "LONG_TERM"]),
  riskAppetite: z.enum(["CONSERVATIVE", "MODERATE", "AGGRESSIVE"]),
}).refine(
  (d) => d.monthlyIncome > d.fixedExpenses + d.discretionaryExpenses,
  { message: "Expenses cannot exceed income", path: ["fixedExpenses"] }
);

export const tradeSchema = z.object({
  symbol: z.string().min(1),
  type: z.enum(["BUY", "SELL"]),
  quantity: z.number().int().positive("Quantity must be a positive integer"),
  price: z.number().positive(),
});

export const backtestSchema = z.object({
  symbol: z.string().min(1, "Select a symbol"),
  strategy: z.enum(["RSI_MEAN_REVERSION","MACD_CROSSOVER","GOLDEN_CROSS","BB_BOUNCE","COMBINED"]),
  dateFrom: z.string().min(1, "Select start date"),
  dateTo: z.string().min(1, "Select end date"),
  initialCapital: z.number().min(10000, "Minimum capital is ₹10,000"),
  positionSize: z.number().min(1).max(100),
}).refine((d) => new Date(d.dateTo) > new Date(d.dateFrom), {
  message: "End date must be after start date",
  path: ["dateTo"],
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type TradeInput = z.infer<typeof tradeSchema>;
export type BacktestInput = z.infer<typeof backtestSchema>;