import { Prisma, RiskAppetite } from '@prisma/client';
import prisma from '@/config/db';
import { AppError, ConflictError, NotFoundError } from '@/utils/AppError';
import { FinancialProfileInput } from '@/validators/profile.validator';

/**
 * Business logic: calculates the safe investable capacity.
 * formula: investable_amount = monthly_income - monthly_expenses - emergency_buffer
 * where emergency_buffer = 20% of monthly_income.
 * Stores 0 if the calculation is negative.
 */
export function calculateInvestableAmount(income: number, expenses: number): number {
  const emergencyBuffer = 0.2 * income;
  const result = income - expenses - emergencyBuffer;
  return Math.max(0, result);
}

/**
 * Fetches the financial profile for a specific user.
 * Returns null if not created yet.
 */
export async function getProfileByUserId(userId: string) {
  return prisma.financialProfile.findUnique({
    where: { userId },
  });
}

/**
 * Creates a new financial profile for the user.
 * Throws ConflictError if user already has one.
 */
export async function createFinancialProfile(userId: string, input: FinancialProfileInput) {
  // Check 1-to-1 uniqueness
  const existing = await getProfileByUserId(userId);
  if (existing) {
    throw new ConflictError('Financial profile already exists. Use PUT /me to update.');
  }

  // Calculate dynamic field
  const investableAmount = calculateInvestableAmount(
    input.monthly_income,
    input.monthly_expenses
  );

  // Map incoming camel/snake schema to Prisma data structure
  return prisma.financialProfile.create({
    data: {
      userId,
      monthlyIncome: new Prisma.Decimal(input.monthly_income),
      monthlyExpenses: new Prisma.Decimal(input.monthly_expenses),
      currentSavings: new Prisma.Decimal(input.current_savings),
      financialGoal: input.financial_goal ?? null,
      riskAppetite: input.risk_appetite as RiskAppetite,
      investableAmount: new Prisma.Decimal(investableAmount),
    },
  });
}

/**
 * Updates an existing financial profile and recalculates the investable amount.
 * Throws NotFoundError if profile does not exist.
 */
export async function updateFinancialProfile(userId: string, input: FinancialProfileInput) {
  const existing = await getProfileByUserId(userId);
  if (!existing) {
    throw new NotFoundError('Financial profile');
  }

  // Recalculate
  const investableAmount = calculateInvestableAmount(
    input.monthly_income,
    input.monthly_expenses
  );

  return prisma.financialProfile.update({
    where: { userId },
    data: {
      monthlyIncome: new Prisma.Decimal(input.monthly_income),
      monthlyExpenses: new Prisma.Decimal(input.monthly_expenses),
      currentSavings: new Prisma.Decimal(input.current_savings),
      financialGoal: input.financial_goal ?? null,
      riskAppetite: input.risk_appetite as RiskAppetite,
      investableAmount: new Prisma.Decimal(investableAmount),
    },
  });
}
