import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const thread = await prisma.thread.findUnique({
      where: {
        id: id
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          }
        },
        contributions: {
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
          },
          orderBy: {
            createdAt: 'asc'
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

    if (!thread) {
      return NextResponse.json(
        { error: 'Thread not found' },
        { status: 404 }
      )
    }

    // Add cache headers for public thread data
    const response = NextResponse.json(thread)
    response.headers.set('Cache-Control', 's-maxage=60, stale-while-revalidate=600')
    return response

  } catch (error: any) {
    console.error('Error fetching thread:', error)
    return NextResponse.json(
      { error: 'Failed to fetch thread' },
      { status: 500 }
    )
  }
}