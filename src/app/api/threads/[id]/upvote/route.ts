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

    // Check if thread exists
    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
    });

    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    // Check if user already upvoted this thread
    const existingUpvote = await prisma.upvote.findUnique({
      where: {
        userId_threadId: {
          userId: user.id,
          threadId: threadId,
        },
      },
    });

    if (existingUpvote) {
      // Remove upvote (toggle off)
      await prisma.upvote.delete({
        where: {
          id: existingUpvote.id,
        },
      });

      // Get updated count
      const upvoteCount = await prisma.upvote.count({
        where: { threadId: threadId },
      });

      return NextResponse.json({ 
        success: true, 
        upvoted: false, 
        upvoteCount 
      });
    } else {
      // Add upvote (toggle on)
      await prisma.upvote.create({
        data: {
          userId: user.id,
          threadId: threadId,
        },
      });

      // Get updated count
      const upvoteCount = await prisma.upvote.count({
        where: { threadId: threadId },
      });

      return NextResponse.json({ 
        success: true, 
        upvoted: true, 
        upvoteCount 
      });
    }

  } catch (error) {
    console.error('Error handling upvote:', error);
    return NextResponse.json({ error: 'Failed to handle upvote' }, { status: 500 });
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

    // Get upvote count
    const upvoteCount = await prisma.upvote.count({
      where: { threadId: threadId },
    });

    let hasUpvoted = false;
    if (user) {
      const existingUpvote = await prisma.upvote.findUnique({
        where: {
          userId_threadId: {
            userId: user.id,
            threadId: threadId,
          },
        },
      });
      hasUpvoted = !!existingUpvote;
    }

    return NextResponse.json({ 
      upvoteCount, 
      hasUpvoted 
    });

  } catch (error) {
    console.error('Error getting upvote status:', error);
    return NextResponse.json({ error: 'Failed to get upvote status' }, { status: 500 });
  }
}
