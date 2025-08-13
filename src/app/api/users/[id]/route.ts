import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';

// GET /api/users/[id] - Get user profile
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

    // Get user profile with counts
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        bio: true,
        website: true,
        location: true,
        createdAt: true,
        _count: {
          select: {
            threads: true,
            followers: true,
            following: true,
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if current user is following this user
    let isFollowing = false;
    if (currentUser && currentUser.id !== userId) {
      const followRelation = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: currentUser.id,
            followingId: userId,
          }
        }
      });
      isFollowing = !!followRelation;
    }

    // Get recent threads by this user
    const recentThreads = await prisma.thread.findMany({
      where: { 
        authorId: userId,
        isContribution: false, // Only main threads, not contributions
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        title: true,
        summary: true,
        source: true,
        tags: true,
        createdAt: true,
        _count: {
          select: {
            upvotes: true,
            contributions: true,
          }
        }
      }
    });

    return NextResponse.json({
      user: {
        ...user,
        isFollowing,
        stats: {
          threads: user._count.threads,
          followers: user._count.followers,
          following: user._count.following,
        }
      },
      recentThreads,
      isOwnProfile: currentUser?.id === userId,
    });

  } catch (error: any) {
    console.error('Get user profile error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
}

// PATCH /api/users/[id] - Update user profile (only own profile)
export async function PATCH(
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

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Can only update own profile
    if (user.id !== userId) {
      return NextResponse.json({ error: 'Can only update your own profile' }, { status: 403 });
    }

    const { name, bio, website, location, avatarUrl } = await request.json();

    // Validate inputs
    if (name && name.length > 100) {
      return NextResponse.json({ error: 'Name too long (max 100 characters)' }, { status: 400 });
    }
    if (bio && bio.length > 500) {
      return NextResponse.json({ error: 'Bio too long (max 500 characters)' }, { status: 400 });
    }
    if (website && website.length > 200) {
      return NextResponse.json({ error: 'Website URL too long (max 200 characters)' }, { status: 400 });
    }
    if (location && location.length > 100) {
      return NextResponse.json({ error: 'Location too long (max 100 characters)' }, { status: 400 });
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name !== undefined && { name }),
        ...(bio !== undefined && { bio }),
        ...(website !== undefined && { website }),
        ...(location !== undefined && { location }),
        ...(avatarUrl !== undefined && { avatarUrl }),
      },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        bio: true,
        website: true,
        location: true,
      }
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });

  } catch (error: any) {
    console.error('Update user profile error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
