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

export async function POST(request: NextRequest) {
  try {
    const { email, message } = await request.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email address is required' },
        { status: 400 }
      )
    }

    // Check if email already exists in waitlist
    const existingEntry = await prisma.waitlistEntry.findUnique({
      where: { email }
    })

    if (existingEntry) {
      return NextResponse.json(
        { error: 'Email already on waitlist' },
        { status: 409 }
      )
    }

    // Add to waitlist
    const waitlistEntry = await prisma.waitlistEntry.create({
      data: {
        email: email.toLowerCase().trim(),
        message: message?.trim() || null,
      }
    })

    return NextResponse.json(
      { 
        success: true, 
        message: 'Successfully added to waitlist!',
        id: waitlistEntry.id 
      },
      { status: 201 }
    )

  } catch (error: any) {
    console.error('Error adding to waitlist:', error)
    return NextResponse.json(
      { error: 'Failed to join waitlist', details: error.message },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Admin endpoint to view waitlist stats
    const { searchParams } = new URL(request.url)
    const adminKey = searchParams.get('admin')
    
    // Simple admin protection - you can enhance this
    if (adminKey !== process.env.ADMIN_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const stats = await prisma.waitlistEntry.aggregate({
      _count: true,
    })

    const recentEntries = await prisma.waitlistEntry.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        createdAt: true,
        notified: true,
      }
    })

    return NextResponse.json({
      totalEntries: stats._count,
      recentEntries,
    })

  } catch (error: any) {
    console.error('Error fetching waitlist stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}