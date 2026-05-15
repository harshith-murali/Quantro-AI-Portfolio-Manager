import { PrismaClient, Role, RiskAppetite } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('🌱 Seeding database with realistic data...');

  const password = 'FinTech@Secure123!';
  const hashedPassword = await bcrypt.hash(password, 12);

  // 1. Create User
  const user = await prisma.user.upsert({
    where: { email: 'user@fintech.dev' },
    update: {},
    create: {
      name: 'FinTech User',
      email: 'user@fintech.dev',
      hashedPassword,
      role: Role.USER,
    },
  });

  // 2. Create Financial Profile
  await prisma.financialProfile.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      riskAppetite: RiskAppetite.MEDIUM,
      monthlyIncome: 150000,
      monthlyExpenses: 60000,
      currentSavings: 1000000,
      investableAmount: 40000,
      financialGoal: 'Wealth accumulation and retirement planning.',
    },
  });

  // 3. Create Wallet
  await prisma.wallet.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      balance: 50000,
    },
  });

  // 4. Create Holdings
  const holdings = [
    { symbol: 'RELIANCE', quantity: 10, averageBuyPrice: 2800 },
    { symbol: 'TCS', quantity: 5, averageBuyPrice: 3800 },
    { symbol: 'INFY', quantity: 15, averageBuyPrice: 1400 },
  ];

  for (const h of holdings) {
    await prisma.holding.upsert({
      where: { userId_symbol: { userId: user.id, symbol: h.symbol } },
      update: {},
      create: {
        userId: user.id,
        symbol: h.symbol,
        quantity: h.quantity,
        averageBuyPrice: h.averageBuyPrice,
        totalInvested: h.quantity * h.averageBuyPrice,
      },
    });
  }

  // 5. Create Portfolio History (Last 30 Days)
  const historyData = [];
  const baseInvested = 95000; // sum of holdings approx
  for (let i = 30; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    // Add some random noise and a slight upward trend
    const marketValue = baseInvested + (30 - i) * 500 + (Math.random() - 0.5) * 5000;
    const pnl = marketValue - baseInvested;

    historyData.push({
      userId: user.id,
      date,
      totalValue: marketValue,
      invested: baseInvested,
      pnl: pnl,
    });
  }

  // delete old history to avoid unique constraint date errors if re-running
  await prisma.portfolioHistory.deleteMany({ where: { userId: user.id } });
  await prisma.portfolioHistory.createMany({ data: historyData });

  console.log('✅ Seeded user, profile, holdings, and 30 days of history.');
  console.log(`   User: user@fintech.dev`);
  console.log(`   Password: ${password}`);
}

main()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
