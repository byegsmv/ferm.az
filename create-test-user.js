// Create a test admin user for local development
import { prisma } from './src/lib/prisma.js';
import { hashPassword } from './src/lib/auth.js';

async function main() {
  const email = 'admin@fermermarket.az';
  const username = 'admin';
  const password = 'Admin1234';
  const fullName = 'Test Admin';
  const phone = '+994501234567';

  // Check if user already exists
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] }
  });

  if (existing) {
    console.log(`User already exists: ${existing.email} (id: ${existing.id})`);
    console.log(`Login with: ${username} / ${password}`);
    process.exit(0);
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email,
      username,
      passwordHash,
      fullName,
      phone,
      role: 'ADMIN',
      status: 'ACTIVE',
      locale: 'AZ',
      wallet: {
        create: {
          coins: 1000,
          transactions: {
            create: [
              { type: 'COIN_GIFT', amount: 1000, description: 'Test admin bonus' },
            ],
          },
        },
      },
    },
  });

  console.log('✅ Test admin user created!');
  console.log(`Login: ${username}`);
  console.log(`Password: ${password}`);
  console.log(`Role: ${user.role}`);
  console.log(`Status: ${user.status}`);
  
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
