import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { content, source, tags, title, summary, shareUrl } = await request.json()

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

    // Clean content by removing vote indicators and other noise
    const cleanContent = (text: string): string => {
      return text
        // Remove standalone vote indicators like +1, +5, +7, etc.
        .replace(/\n\s*\+\d+\s*\n/g, '\n')
        .replace(/^\s*\+\d+\s*$/gm, '')
        // Remove vote indicators at start of lines
        .replace(/^\s*\+\d+\s+/gm, '')
        // Remove vote indicators at end of lines
        .replace(/\s+\+\d+\s*$/gm, '')
        // Remove Reddit-style vote patterns
        .replace(/\s*\(\+\d+\)\s*/g, ' ')
        // Remove GitHub-style vote patterns
        .replace(/\s*👍\s*\+\d+\s*/g, ' ')
        .replace(/\s*👎\s*-\d+\s*/g, ' ')
        // Clean up extra whitespace
        .replace(/\n\s*\n\s*\n/g, '\n\n')
        .trim();
    };

    const cleanedContent = cleanContent(content);

    // Create the thread
    const thread = await prisma.thread.create({
      data: {
        content: cleanedContent,
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

    // Create notifications for followers (async, don't wait)
    prisma.user.findUnique({
      where: { id: user.id },
      select: { name: true }
    }).then(async (currentUser) => {
      const followers = await prisma.follow.findMany({
        where: { followingId: user.id },
        select: { followerId: true }
      });
      
      if (followers.length > 0) {
        const notifications = followers.map(follow => ({
          userId: follow.followerId,
          type: 'new_post',
          title: 'New Post',
          message: `${currentUser?.name || user.email?.split('@')[0] || 'Someone you follow'} shared a new AI conversation`,
          threadId: thread.id,
          fromUserId: user.id,
        }));

        await prisma.notification.createMany({
          data: notifications
        });
      }
    }).catch(err => {
      console.error('Failed to create notifications:', err);
    });

    // Auto-detection: Try to match with pending shares
    try {
      // If we have the originating share URL from the bookmarklet, close it deterministically first
      if (shareUrl) {
        const exact = await prisma.pendingShare.findFirst({
          where: { userId: user.id, status: 'pending', url: shareUrl }
        })
        if (exact) {
          await prisma.pendingShare.update({
            where: { id: exact.id },
            data: { status: 'completed', completedAt: new Date() }
          })
          if (!source && exact.platform) {
            await prisma.thread.update({ where: { id: thread.id }, data: { source: exact.platform } })
          }
          return NextResponse.json(thread)
        }
      }

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

      // Enhanced matching logic for multiple platforms
      const isFromBookmarklet = cleanedContent.includes('🧑 You:') || 
                               cleanedContent.includes('🤖 ChatGPT:') ||
                               cleanedContent.includes('🤖 Claude:') ||
                               cleanedContent.includes('🤖 Gemini:') ||
                               cleanedContent.includes('🤖 Copilot:') ||
                               cleanedContent.includes('🤖 Grok:') ||
                               cleanedContent.includes('🤖 Perplexity:');

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

          // Platform bonus if source specified and matches
          if (source && share.platform && share.platform.toLowerCase() === source.toLowerCase()) {
            score += 3;
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

        // If we found a reasonable match, mark it as completed
        // Lowered threshold and added fallback heuristics for bookmarklet flow
        if (bestMatch && bestScore >= 1) {
          await prisma.pendingShare.update({
            where: { id: bestMatch.id },
            data: {
              status: 'completed',
              completedAt: new Date(),
            },
          });
          
          // If no source was specified but we have platform info from the pending share, use it
          if (!source && bestMatch.platform) {
            await prisma.thread.update({
              where: { id: thread.id },
              data: { source: bestMatch.platform }
            });
          }
          
          console.log(`Auto-matched thread ${thread.id} with pending share ${bestMatch.id} (score: ${bestScore})`);
        } else {
          // Fallbacks: if only one pending share exists, or pick the most recent within 2 hours
          let fallback: any = null;
          if (pendingShares.length === 1) {
            fallback = pendingShares[0];
          } else {
            fallback = pendingShares.find((s: any) => (Date.now() - new Date(s.createdAt).getTime()) < (1000 * 60 * 60 * 2));
          }

          if (fallback) {
            await prisma.pendingShare.update({
              where: { id: fallback.id },
              data: {
                status: 'completed',
                completedAt: new Date(),
              },
            });
            if (!source && fallback.platform) {
              await prisma.thread.update({
                where: { id: thread.id },
                data: { source: fallback.platform }
              });
            }
            console.log(`Fallback matched thread ${thread.id} with pending share ${fallback.id}`);
          }
        }
      }
      
      // Auto-detect platform from content if no source is specified
      if (!source && isFromBookmarklet) {
        let detectedPlatform = null;
        
        if (cleanedContent.includes('🤖 ChatGPT:')) detectedPlatform = 'ChatGPT';
        else if (cleanedContent.includes('🤖 Claude:')) detectedPlatform = 'Claude';
        else if (cleanedContent.includes('🤖 Gemini:')) detectedPlatform = 'Gemini';
        else if (cleanedContent.includes('🤖 Copilot:')) detectedPlatform = 'Copilot';
        else if (cleanedContent.includes('🤖 Grok:')) detectedPlatform = 'Grok';
        else if (cleanedContent.includes('🤖 Perplexity:')) detectedPlatform = 'Perplexity';
        
        if (detectedPlatform) {
          await prisma.thread.update({
            where: { id: thread.id },
            data: { source: detectedPlatform }
          });
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
    const followingOnly = searchParams.get('following') === 'true'
    const sortBy = searchParams.get('sort') || 'latest' // 'latest' or 'popular'

    // Get authenticated user for following filter
    let currentUserId = null;
    if (followingOnly) {
      const cookieStore = await cookies()
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) { return cookieStore.get(name)?.value },
            set(name: string, value: string, options: any) { cookieStore.set({ name, value, ...options }) },
            remove(name: string, options: any) { cookieStore.set({ name, value: '', ...options }) },
          },
        }
      )

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        currentUserId = user.id;
      }
    }

    // Build where clause
    let whereClause: any = {
      isContribution: false  // Only show original threads, not contributions
    };

    if (followingOnly && currentUserId) {
      // Get list of users the current user is following
      const followedUsers = await prisma.follow.findMany({
        where: { followerId: currentUserId },
        select: { followingId: true }
      });

      if (followedUsers.length === 0) {
        // User is not following anyone, return empty array
        return NextResponse.json([]);
      }

      whereClause.authorId = {
        in: followedUsers.map(f => f.followingId)
      };
    }

    let threads;
    
    if (sortBy === 'popular') {
      // Sort by net upvotes (upvotes - downvotes)
      threads = await prisma.thread.findMany({
        where: whereClause,
        take: limit,
        skip: offset,
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
      });
      
      // Sort by net upvotes in JavaScript since Prisma doesn't support computed fields in orderBy
      threads = threads.sort((a, b) => {
        const aNetVotes = a._count.upvotes - a._count.downvotes;
        const bNetVotes = b._count.upvotes - b._count.downvotes;
        return bNetVotes - aNetVotes; // Highest net votes first
      });
      
    } else {
      // Sort by latest activity (most recent contribution or thread creation)
      const threadsWithActivity = await prisma.thread.findMany({
        where: whereClause,
        take: limit,
        skip: offset,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            }
          },
          contributions: {
            select: {
              createdAt: true,
            },
            orderBy: {
              createdAt: 'desc'
            },
            take: 1 // Only need the most recent contribution
          },
          _count: {
            select: {
              comments: true,
              upvotes: true,
              downvotes: true,
            }
          }
        }
      });
      
      // Sort by latest activity (either thread creation or most recent contribution)
      threads = threadsWithActivity
        .map(thread => ({
          ...thread,
          latestActivity: thread.contributions.length > 0 
            ? new Date(thread.contributions[0].createdAt)
            : new Date(thread.createdAt)
        }))
        .sort((a, b) => b.latestActivity.getTime() - a.latestActivity.getTime())
        .map(({ latestActivity, contributions, ...thread }) => thread); // Remove helper fields
    }

    const response = NextResponse.json(threads)
    // Cache public thread list for 60s, allow stale for 10min
    response.headers.set('Cache-Control', 's-maxage=60, stale-while-revalidate=600')
    return response

  } catch (error: any) {
    console.error('Error fetching threads:', error)
    return NextResponse.json(
      { error: 'Failed to fetch threads' },
      { status: 500 }
    )
  }
}