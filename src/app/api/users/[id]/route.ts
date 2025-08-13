import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { PerformanceTracker } from '@/lib/performance';

// GET /api/users/[id] - Get user profile
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    PerformanceTracker.start('Profile API - Total');
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

    PerformanceTracker.start('Profile API - Auth');
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    PerformanceTracker.end('Profile API - Auth');

    // Get user profile (remove expensive _count for speed)
    PerformanceTracker.start('Profile API - User Query');
    const user = await PerformanceTracker.trackQuery('user.findUnique', () =>
      prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        bio: true,
        website: true,
        location: true,
        createdAt: true,
        // Temporarily remove _count queries - they're causing 7s delays
        // TODO: Add lightweight count queries or denormalized counters later
      }
    }));
    PerformanceTracker.end('Profile API - User Query');

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Optimize: Run follow check and threads query in parallel, remove expensive _count
    PerformanceTracker.start('Profile API - Parallel Queries');
    const [followRelation, recentThreads] = await Promise.all([
      // Check if current user is following this user
      currentUser && currentUser.id !== userId
        ? prisma.follow.findUnique({
            where: {
              followerId_followingId: {
                followerId: currentUser.id,
                followingId: userId,
              }
            }
          })
        : Promise.resolve(null),
      
      // Get recent threads by this user (remove expensive _count for speed)
      prisma.thread.findMany({
        where: { 
          authorId: userId,
          isContribution: false,
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
          // Temporarily remove _count queries - they're causing 7s delays
          // TODO: Add denormalized counters to Thread table later
        }
      })
    ]);
    PerformanceTracker.end('Profile API - Parallel Queries');

    const isFollowing = !!followRelation;

    const totalTime = PerformanceTracker.end('Profile API - Total');
    
    const response = NextResponse.json({
      user: {
        ...user,
        isFollowing,
        stats: {
          threads: 0, // Temporarily disabled for speed
          followers: 0, // TODO: Add lightweight count queries
          following: 0, // or denormalized counters
        }
      },
      recentThreads,
      isOwnProfile: currentUser?.id === userId,
    });
    
    // Add performance timing headers for client visibility
    PerformanceTracker.addServerTiming(response, {
      'profile-total': totalTime,
    });
    
    // Cache profile data for 30s (private since includes follow status)
    response.headers.set('Cache-Control', 'private, max-age=30');
    return response;

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
