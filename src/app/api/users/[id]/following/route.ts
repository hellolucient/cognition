import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';

// GET /api/users/[id]/following - Get users that this user follows
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value; },
          set(name: string, value: string, options: any) { cookieStore.set({ name, value, ...options }); },
          remove(name: string, options: any) { cookieStore.set({ name, value: '', ...options }); },
        },
      }
    );

    const { data: { user: currentUser } } = await supabase.auth.getUser();
    const currentUserId = currentUser?.id;

    // Get the profile name
    const profile = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true }
    });

    if (!profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get all users this user follows
    const followingRelations = await prisma.follow.findMany({
      where: { followerId: userId },
      include: {
        following: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            bio: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // If current user is logged in, check which of these users they follow
    let currentUserFollowing: string[] = [];
    if (currentUserId) {
      const currentFollowing = await prisma.follow.findMany({
        where: { followerId: currentUserId },
        select: { followingId: true }
      });
      currentUserFollowing = currentFollowing.map(f => f.followingId);
    }

    const following = followingRelations.map(relation => ({
      id: relation.following.id,
      name: relation.following.name,
      avatarUrl: relation.following.avatarUrl,
      bio: relation.following.bio,
      followedAt: relation.createdAt.toISOString(),
      isFollowing: currentUserFollowing.includes(relation.following.id),
    }));

    return NextResponse.json({
      following,
      profileName: profile.name,
      count: following.length
    });

  } catch (error: any) {
    console.error('Get following error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch following list' },
      { status: 500 }
    );
  }
}
