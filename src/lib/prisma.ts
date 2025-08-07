import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const prisma = globalThis.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: ['error'],
  // Disable prepared statements to avoid conflicts in serverless
  // This is a known issue with Prisma in Vercel
  engineType: 'library' as any,
});

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

// Ensure connection is properly closed on process exit
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;
