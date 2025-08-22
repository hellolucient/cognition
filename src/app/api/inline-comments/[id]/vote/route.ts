import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/prisma';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const resolvedParams = await params;
    const inlineCommentId = resolvedParams.id;
    const body = await request.json();
    const { voteType } = body;

    if (!voteType || !['like', 'dislike'].includes(voteType)) {
      return NextResponse.json({ error: 'Invalid vote type' }, { status: 400 });
    }

    // Check if user already voted
    const existingVote = await prisma.textSegmentVote.findUnique({
      where: {
        userId_inlineCommentId: {
          userId: user.id,
          inlineCommentId
        }
      }
    });

    if (existingVote) {
      if (existingVote.voteType === voteType) {
        // Remove vote if clicking same button
        await prisma.textSegmentVote.delete({
          where: { id: existingVote.id }
        });
      } else {
        // Update vote if changing vote type
        await prisma.textSegmentVote.update({
          where: { id: existingVote.id },
          data: { voteType }
        });
      }
    } else {
      // Create new vote
      await prisma.textSegmentVote.create({
        data: {
          userId: user.id,
          inlineCommentId,
          voteType
        }
      });
    }

    // Get updated vote counts
    const votes = await prisma.textSegmentVote.findMany({
      where: { inlineCommentId }
    });

    const likeCount = votes.filter(v => v.voteType === 'like').length;
    const dislikeCount = votes.filter(v => v.voteType === 'dislike').length;
    const userVote = votes.find(v => v.userId === user.id)?.voteType || null;

    return NextResponse.json({
      likeCount,
      dislikeCount,
      userVote
    });
  } catch (error) {
    console.error('Error voting on inline comment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
