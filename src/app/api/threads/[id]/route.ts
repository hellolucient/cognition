import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Add connection resilience for regional connectivity issues
  log: ['error'],
})

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

    return NextResponse.json(thread)

  } catch (error: any) {
    console.error('Error fetching thread:', error)
    return NextResponse.json(
      { error: 'Failed to fetch thread' },
      { status: 500 }
    )
  }
}