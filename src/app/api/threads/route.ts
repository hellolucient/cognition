import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma';


      // Simple matching logic - if the thread title matches or is similar to a pending share title
      // or if this submission came from bookmarklet (indicated by source containing 'ChatGPT')
      const isFromBookmarklet = source?.toLowerCase().includes('chatgpt') || 
                               content.includes('🧑 You:') || 
                               content.includes('🤖 ChatGPT:');

      if (isFromBookmarklet && pendingShares.length > 0) {
        // Try to find the best match
        let bestMatch = null;
        let bestScore = 0;

        for (const share of pendingShares) {
          let score = 0;
          
          // Title similarity
          if (share.title && title) {
            const titleWords = title.toLowerCase().split(' ');
            const shareWords = share.title.toLowerCase().split(' ');
            const commonWords = titleWords.filter(word => shareWords.includes(word));
            score += commonWords.length * 2;
          }
          
          // Recency bonus (more recent = higher score)
          const ageInHours = (Date.now() - new Date(share.createdAt).getTime()) / (1000 * 60 * 60);
          if (ageInHours < 1) score += 10;
          else if (ageInHours < 6) score += 5;
          else if (ageInHours < 24) score += 2;
          
          if (score > bestScore) {
            bestScore = score;
            bestMatch = share;
          }
        }

        // If we found a reasonable match (score > 2), mark it as completed
        if (bestMatch && bestScore > 2) {
          await prisma.pendingShare.update({
            where: { id: bestMatch.id },
            data: {
              status: 'completed',
              completedAt: new Date(),
            },
          });
          
          console.log(`Auto-matched thread ${thread.id} with pending share ${bestMatch.id} (score: ${bestScore})`);
        }
      }
    } catch (autoDetectionError) {
      // Don't fail the thread creation if auto-detection fails
      console.error('Auto-detection error:', autoDetectionError);
    }

    return NextResponse.json(thread)

  } catch (error: any) {
    console.error('Error creating thread:', error)
    return NextResponse.json(
      { error: 'Failed to create thread' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const threads = await prisma.thread.findMany({
      where: {
        isContribution: false  // Only show original threads, not contributions
      },
      take: limit,
      skip: offset,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          }
        },
        _count: {
          select: {
            comments: true,
            upvotes: true,
          }
        }
      }
    })

    return NextResponse.json(threads)

  } catch (error: any) {
    console.error('Error fetching threads:', error)
    return NextResponse.json(
      { error: 'Failed to fetch threads' },
      { status: 500 }
    )
  }
}