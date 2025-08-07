import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['upvote', 'downvote'].includes(voteType)) {
      return NextResponse.json({ error: 'Invalid vote type' }, { status: 400 });
    }

    // Check if thread exists
    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
    });

    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    // Check existing votes
    const existingUpvote = await prisma.upvote.findUnique({
      where: {
        userId_threadId: {
          userId: user.id,
          threadId: threadId,
        },
      },
    });

    const existingDownvote = await prisma.downvote.findUnique({
      where: {
        userId_threadId: {
          userId: user.id,
          threadId: threadId,
        },
      },
    });

    // Handle vote logic
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

    // Get updated counts and user vote status
    const upvoteCount = await prisma.upvote.count({
      where: { threadId: threadId },
    });

    const downvoteCount = await prisma.downvote.count({
      where: { threadId: threadId },
    });

    const hasUpvoted = await prisma.upvote.findUnique({
      where: {
        userId_threadId: {
          userId: user.id,
          threadId: threadId,
        },
      },
    });

    const hasDownvoted = await prisma.downvote.findUnique({
      where: {
        userId_threadId: {
          userId: user.id,
          threadId: threadId,
        },
      },
    });

    return NextResponse.json({ 
      success: true, 
      upvoteCount,
      downvoteCount,
      hasUpvoted: !!hasUpvoted,
      hasDownvoted: !!hasDownvoted
    });

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

    // Get vote counts
    const upvoteCount = await prisma.upvote.count({
      where: { threadId: threadId },
    });

    const downvoteCount = await prisma.downvote.count({
      where: { threadId: threadId },
    });

    let hasUpvoted = false;
    let hasDownvoted = false;

    if (user) {
      const existingUpvote = await prisma.upvote.findUnique({
        where: {
          userId_threadId: {
            userId: user.id,
            threadId: threadId,
          },
        },
      });

      const existingDownvote = await prisma.downvote.findUnique({
        where: {
          userId_threadId: {
            userId: user.id,
            threadId: threadId,
          },
        },
      });

      hasUpvoted = !!existingUpvote;
      hasDownvoted = !!existingDownvote;
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
