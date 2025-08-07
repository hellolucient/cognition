import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Add connection resilience for regional connectivity issues
  log: ['error'],
});

// GET /api/pending-shares/count - Get count of user's pending shares
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const pendingCount = await prisma.pendingShare.count({
      where: {
        userId: user.id,
        status: 'pending',
      },
    });

    const completedCount = await prisma.pendingShare.count({
      where: {
        userId: user.id,
        status: 'completed',
      },
    });

    const totalCount = await prisma.pendingShare.count({
      where: {
        userId: user.id,
      },
    });

    return NextResponse.json({ 
      pending: pendingCount,
      completed: completedCount,
      total: totalCount
    });
  } catch (error) {
    console.error('Error fetching pending shares count:', error);
    return NextResponse.json(
      { error: 'Failed to fetch count' },
      { status: 500 }
    );
  }
}