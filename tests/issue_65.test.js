const { PrismaClient } = require('@prisma/client');

describe('Reproduce Issue 65', () => {
  let prisma;

  beforeAll(async () => {
    prisma = new PrismaClient();
    await prisma.$connect(); // Ensure database connection is established
  });

  afterAll(async () => {
    await prisma.$disconnect(); // Close the database connection
  });

  it('should not throw an error when fetching ATS analyses', async () => {
    try {
      const user = { id: 'test-user-id' }; // Mock user object
      await prisma.aTSAnalysis.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
      });
    } catch (error) {
      expect(error).not.toBeInstanceOf(Error);
      expect(error.message).toBeUndefined();
    }
  });
});