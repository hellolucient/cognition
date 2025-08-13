import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';

// POST /api/users/[id]/follow - Follow a user
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: targetUserId } = await params;
    
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

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Can't follow yourself
    if (user.id === targetUserId) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
    }

    // Get the current user's info from database
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, name: true }
    });

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, name: true }
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if already following
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: user.id,
          followingId: targetUserId,
        }
      }
    });

    if (existingFollow) {
      return NextResponse.json({ error: 'Already following this user' }, { status: 409 });
    }

    // Create follow relationship
    const follow = await prisma.follow.create({
      data: {
        followerId: user.id,
        followingId: targetUserId,
      }
    });

    // Create notification for the followed user
    await prisma.notification.create({
      data: {
        userId: targetUserId,
        type: 'new_follower',
        title: 'New Follower',
        message: `${currentUser?.name || user.email?.split('@')[0] || 'Someone'} started following you`,
        fromUserId: user.id,
      }
    });

    // Get updated follow counts
    const [followingCount, followersCount] = await Promise.all([
      prisma.follow.count({ where: { followerId: user.id } }),
      prisma.follow.count({ where: { followingId: targetUserId } })
    ]);

    return NextResponse.json({
      success: true,
      following: true,
      followingCount,
      followersCount,
    });

  } catch (error: any) {
    console.error('Follow user error:', error);
    return NextResponse.json(
      { error: 'Failed to follow user' },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id]/follow - Unfollow a user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: targetUserId } = await params;
    
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

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Delete follow relationship
    const deletedFollow = await prisma.follow.deleteMany({
      where: {
        followerId: user.id,
        followingId: targetUserId,
      }
    });

    if (deletedFollow.count === 0) {
      return NextResponse.json({ error: 'Not following this user' }, { status: 404 });
    }

    // Get updated follow counts
    const [followingCount, followersCount] = await Promise.all([
      prisma.follow.count({ where: { followerId: user.id } }),
      prisma.follow.count({ where: { followingId: targetUserId } })
    ]);

    return NextResponse.json({
      success: true,
      following: false,
      followingCount,
      followersCount,
    });

  } catch (error: any) {
    console.error('Unfollow user error:', error);
    return NextResponse.json(
      { error: 'Failed to unfollow user' },
      { status: 500 }
    );
  }
}
