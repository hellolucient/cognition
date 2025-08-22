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
    const { threadId, textSegment, voteType } = body;

    if (!threadId || !textSegment || !voteType || !['like', 'dislike'].includes(voteType)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create a unique key for this text segment
    const segmentKey = `${threadId}_${textSegment.slice(0, 100)}`;

    // Check if user already voted on this segment
    const existingVote = await prisma.textSegmentVote.findFirst({
      where: {
        userId: user.id,
        inlineContribution: {
          threadId: threadId,
          referencedText: {
            contains: textSegment.slice(0, 50)
          }
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
      // For now, we'll create a placeholder contribution to store the vote
      // In a more sophisticated system, we might want a separate TextSegmentVote table
      const placeholderContribution = await prisma.inlineContribution.create({
        data: {
          content: `Vote on: "${textSegment.slice(0, 100)}..."`,
          authorId: user.id,
          threadId,
          referencedText: textSegment,
          textStartIndex: 0,
          textEndIndex: textSegment.length,
          isCollapsed: true,
          contributionType: 'manual'
        }
      });

      // Create the vote
      await prisma.textSegmentVote.create({
        data: {
          userId: user.id,
          inlineContributionId: placeholderContribution.id,
          voteType
        }
      });
    }

    // Get updated vote counts for this text segment
    const votes = await prisma.textSegmentVote.findMany({
      where: {
        inlineContribution: {
          threadId: threadId,
          referencedText: {
            contains: textSegment.slice(0, 50)
          }
        }
      }
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
    console.error('Error voting on text segment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
