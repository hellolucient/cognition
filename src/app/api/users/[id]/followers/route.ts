import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';

// GET /api/users/[id]/followers - Get users that follow this user
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

    // Get all users that follow this user
    const followerRelations = await prisma.follow.findMany({
      where: { followingId: userId },
      include: {
        follower: {
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

    const followers = followerRelations.map(relation => ({
      id: relation.follower.id,
      name: relation.follower.name,
      avatarUrl: relation.follower.avatarUrl,
      bio: relation.follower.bio,
      followedAt: relation.createdAt.toISOString(),
      isFollowing: currentUserFollowing.includes(relation.follower.id),
    }));

    return NextResponse.json({
      followers,
      profileName: profile.name,
      count: followers.length
    });

  } catch (error: any) {
    console.error('Get followers error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch followers list' },
      { status: 500 }
    );
  }
}
