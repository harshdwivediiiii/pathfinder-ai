const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { clerkUserId: 'dummy_user_123' },
    update: {},
    create: {
      clerkUserId: 'dummy_user_123',
      email: 'dummy@test.com',
      name: 'Dummy User',
      imageUrl: '',
      industry: 'technology'
    }
  });
  console.log('Dummy user:', user.clerkUserId);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
