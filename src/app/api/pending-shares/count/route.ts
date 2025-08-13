import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';

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

    // Optimize: Single grouped query instead of 3 separate COUNTs
    const counts = await prisma.pendingShare.groupBy({
      by: ['status'],
      where: { userId: user.id },
      _count: { id: true }
    });

    const pendingCount = counts.find(c => c.status === 'pending')?._count.id || 0;
    const completedCount = counts.find(c => c.status === 'completed')?._count.id || 0;
    const totalCount = pendingCount + completedCount;

    const response = NextResponse.json({ 
      pending: pendingCount,
      completed: completedCount,
      total: totalCount
    });
    // Cache private user data for 30s
    response.headers.set('Cache-Control', 'private, max-age=30');
    return response;
  } catch (error) {
    console.error('Error fetching pending shares count:', error);
    return NextResponse.json(
      { error: 'Failed to fetch count' },
      { status: 500 }
    );
  }
}