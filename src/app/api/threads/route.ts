import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { content, source, tags, title, summary } = await request.json()

    // Get the authenticated user
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Validation
    if (!content || !summary) {
      return NextResponse.json(
        { error: 'Content and summary are required' },
        { status: 400 }
      )
    }

    // Check if user exists in our database, create if not
    let dbUser = await prisma.user.findUnique({
      where: { id: user.id }
    })

    if (!dbUser) {
      dbUser = await prisma.user.create({
        data: {
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'Anonymous',
          avatarUrl: user.user_metadata?.avatar_url,
        }
      })
    }

    // Parse tags
    const tagArray = tags ? tags.split(',').map((tag: string) => tag.trim()).filter(Boolean) : []

    // Create the thread
    const thread = await prisma.thread.create({
      data: {
        content,
        title: title || null,
        summary,
        source: source || null,
        tags: tagArray,
        authorId: user.id,
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
            downvotes: true,
          }
        }
      }
    })

    // Auto-detection: Try to match with pending shares
    try {
      // Look for pending shares by this user that might match this submission
      const pendingShares = await prisma.pendingShare.findMany({
        where: {
          userId: user.id,
          status: 'pending',
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10, // Check the 10 most recent pending shares
      });

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
            downvotes: true,
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