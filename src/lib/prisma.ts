import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Add pgbouncer compatibility parameters to disable prepared statements
const getDatabaseUrl = () => {
  const baseUrl = process.env.DATABASE_URL;
  if (!baseUrl) return baseUrl;
  
  // In production, add pgbouncer compatibility parameters
  if (process.env.NODE_ENV === 'production') {
    const url = new URL(baseUrl);
    url.searchParams.set('pgbouncer', 'true');
    url.searchParams.set('statement_cache_size', '0');
    return url.toString();
  }
  
  return baseUrl;
};

const prisma = globalThis.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: getDatabaseUrl(),
    },
  },
  log: ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

// Ensure connection is properly closed on process exit
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;
