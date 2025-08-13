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
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'stdout' },
    { level: 'info', emit: 'stdout' },
    { level: 'warn', emit: 'stdout' },
  ],
});

// Log slow queries for performance analysis
prisma.$on('query', (e) => {
  const duration = e.duration;
  if (duration > 1000) {
    console.warn(`🐌 SLOW QUERY (${duration}ms): ${e.query}`);
  } else if (duration > 500) {
    console.log(`⚠️ MODERATE QUERY (${duration}ms): ${e.query.substring(0, 100)}...`);
  } else if (process.env.NODE_ENV === 'development') {
    console.log(`✅ FAST QUERY (${duration}ms): ${e.query.substring(0, 50)}...`);
  }
});

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

// Ensure connection is properly closed on process exit
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;
