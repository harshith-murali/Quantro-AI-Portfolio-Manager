import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('🌱 Seeding database...');

  const adminEmail = 'admin@fintech.dev';
  const userEmail = 'user@fintech.dev';
  const password = 'FinTech@Secure123!';
  const rounds = 12;

  const hashedPassword = await bcrypt.hash(password, rounds);

  // Upsert admin user
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: 'FinTech Admin',
      email: adminEmail,
      hashedPassword,
      role: Role.ADMIN,
    },
  });

  // Upsert regular user
  const user = await prisma.user.upsert({
    where: { email: userEmail },
    update: {},
    create: {
      name: 'FinTech User',
      email: userEmail,
      hashedPassword,
      role: Role.USER,
    },
  });

  console.log('✅ Seeded users:');
  console.log(`   ADMIN → ${admin.email}  (id: ${admin.id})`);
  console.log(`   USER  → ${user.email}   (id: ${user.id})`);
  console.log(`   Password for both: ${password}`);
}

main()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
