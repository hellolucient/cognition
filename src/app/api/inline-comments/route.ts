import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import prisma from '@/lib/prisma';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { authorization } = request.headers;
    if (!authorization) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    const token = authorization.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { threadId, content, referencedText, textStartIndex, textEndIndex } = body;

    if (!threadId || !content || !referencedText || textStartIndex === undefined || textEndIndex === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify thread exists
    const thread = await prisma.thread.findUnique({
      where: { id: threadId }
    });

    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    // Create inline contribution
    const inlineContribution = await prisma.inlineContribution.create({
      data: {
        content,
        authorId: user.id,
        threadId,
        referencedText,
        textStartIndex,
        textEndIndex,
        isCollapsed: false, // New contributions are expanded for the author
        contributionType: 'manual', // Default to manual, can be updated later
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          }
        }
      }
    });

    return NextResponse.json({ inlineContribution });
  } catch (error) {
    console.error('Error creating inline comment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const threadId = searchParams.get('threadId');

    if (!threadId) {
      return NextResponse.json({ error: 'Thread ID required' }, { status: 400 });
    }

    // Get all inline contributions for a thread
    const inlineContributions = await prisma.inlineContribution.findMany({
      where: { threadId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          }
        },
        textSegmentVotes: {
          select: {
            voteType: true,
            userId: true,
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json({ inlineContributions });
  } catch (error) {
    console.error('Error fetching inline comments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
