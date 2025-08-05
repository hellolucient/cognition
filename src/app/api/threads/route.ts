import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const prisma = new PrismaClient()

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
          }
        }
      }
    })

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