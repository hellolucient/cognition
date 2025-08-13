import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { PerformanceTracker } from '@/lib/performance';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    PerformanceTracker.start('Vote API - Total');
    const resolvedParams = await params;
    const threadId = resolvedParams.id;
    const { voteType } = await request.json(); // 'upvote' or 'downvote'

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

    PerformanceTracker.start('Vote API - Auth');
    const { data: { user } } = await supabase.auth.getUser();
    PerformanceTracker.end('Vote API - Auth');

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['upvote', 'downvote'].includes(voteType)) {
      return NextResponse.json({ error: 'Invalid vote type' }, { status: 400 });
    }

    // Check if thread exists
    PerformanceTracker.start('Vote API - Thread Check');
    const thread = await PerformanceTracker.trackQuery('thread.findUnique', () =>
      prisma.thread.findUnique({
        where: { id: threadId },
      })
    );
    PerformanceTracker.end('Vote API - Thread Check');

    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    // Check existing votes in parallel
    PerformanceTracker.start('Vote API - Existing Votes Check');
    const [existingUpvote, existingDownvote] = await Promise.all([
      PerformanceTracker.trackQuery('upvote.findUnique', () =>
        prisma.upvote.findUnique({
          where: {
            userId_threadId: {
              userId: user.id,
              threadId: threadId,
            },
          },
        })
      ),
      PerformanceTracker.trackQuery('downvote.findUnique', () =>
        prisma.downvote.findUnique({
          where: {
            userId_threadId: {
              userId: user.id,
              threadId: threadId,
            },
          },
        })
      )
    ]);
    PerformanceTracker.end('Vote API - Existing Votes Check');

    // Handle vote logic
    PerformanceTracker.start('Vote API - Vote Logic');
    if (voteType === 'upvote') {
      if (existingUpvote) {
        // Remove upvote (toggle off)
        await prisma.upvote.delete({
          where: { id: existingUpvote.id },
        });
      } else {
        // Remove downvote if exists (can't have both)
        if (existingDownvote) {
          await prisma.downvote.delete({
            where: { id: existingDownvote.id },
          });
        }
        // Add upvote
        await prisma.upvote.create({
          data: {
            userId: user.id,
            threadId: threadId,
          },
        });
      }
    } else { // downvote
      if (existingDownvote) {
        // Remove downvote (toggle off)
        await prisma.downvote.delete({
          where: { id: existingDownvote.id },
        });
      } else {
        // Remove upvote if exists (can't have both)
        if (existingUpvote) {
          await prisma.upvote.delete({
            where: { id: existingUpvote.id },
          });
        }
        // Add downvote
        await prisma.downvote.create({
          data: {
            userId: user.id,
            threadId: threadId,
          },
        });
      }
    }
    PerformanceTracker.end('Vote API - Vote Logic');

    // Get updated counts and user vote status in parallel (reduce 4 queries to 2)
    PerformanceTracker.start('Vote API - Count Update');
    const [upvoteData, downvoteData] = await Promise.all([
      prisma.upvote.findMany({
        where: { threadId: threadId },
        select: { userId: true }
      }),
      prisma.downvote.findMany({
        where: { threadId: threadId },
        select: { userId: true }
      })
    ]);

    const upvoteCount = upvoteData.length;
    const downvoteCount = downvoteData.length;
    const hasUpvoted = upvoteData.some(vote => vote.userId === user.id);
    const hasDownvoted = downvoteData.some(vote => vote.userId === user.id);
    PerformanceTracker.end('Vote API - Count Update');

    const totalTime = PerformanceTracker.end('Vote API - Total');

    const response = NextResponse.json({ 
      success: true, 
      upvoteCount,
      downvoteCount,
      hasUpvoted,
      hasDownvoted
    });
    
    // Add performance timing headers
    PerformanceTracker.addServerTiming(response, {
      'vote-total': totalTime,
    });
    
    // Cache vote data briefly to reduce repeated calls
    response.headers.set('Cache-Control', 'private, max-age=5');
    return response;

  } catch (error) {
    console.error('Error handling vote:', error);
    return NextResponse.json({ error: 'Failed to handle vote' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const threadId = resolvedParams.id;

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

    // Optimize: Get counts and user status in parallel (reduce 4 queries to 2)
    const [upvoteData, downvoteData] = await Promise.all([
      prisma.upvote.findMany({
        where: { threadId: threadId },
        select: { userId: true }
      }),
      prisma.downvote.findMany({
        where: { threadId: threadId },
        select: { userId: true }
      })
    ]);

    const upvoteCount = upvoteData.length;
    const downvoteCount = downvoteData.length;
    let hasUpvoted = false;
    let hasDownvoted = false;

    if (user) {
      hasUpvoted = upvoteData.some(vote => vote.userId === user.id);
      hasDownvoted = downvoteData.some(vote => vote.userId === user.id);
    }

    return NextResponse.json({ 
      upvoteCount, 
      downvoteCount,
      hasUpvoted,
      hasDownvoted
    });

  } catch (error) {
    console.error('Error getting vote status:', error);
    return NextResponse.json({ error: 'Failed to get vote status' }, { status: 500 });
  }
}
