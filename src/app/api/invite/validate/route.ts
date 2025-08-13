import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json()

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Invite code is required' },
        { status: 400 }
      )
    }

    // Find the invite code
    const inviteCode = await prisma.inviteCode.findUnique({
      where: { 
        code: code.trim().toUpperCase() 
      },
      include: {
        createdBy: {
          select: {
            name: true,
            email: true,
          }
        }
      }
    })

    if (!inviteCode) {
      return NextResponse.json(
        { error: 'Invalid invite code' },
        { status: 404 }
      )
    }

    if (!inviteCode.isActive) {
      return NextResponse.json(
        { error: 'This invite code has been deactivated' },
        { status: 410 }
      )
    }

    if (inviteCode.usedAt) {
      return NextResponse.json(
        { error: 'This invite code has already been used' },
        { status: 409 }
      )
    }

    if (inviteCode.expiresAt && inviteCode.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'This invite code has expired' },
        { status: 410 }
      )
    }

    // Valid invite code
    return NextResponse.json({
      valid: true,
      code: inviteCode.code,
      invitedBy: inviteCode.createdBy.name || inviteCode.createdBy.email,
      createdAt: inviteCode.createdAt,
    })

  } catch (error: any) {
    console.error('Error validating invite code:', error)
    return NextResponse.json(
      { error: 'Failed to validate invite code' },
      { status: 500 }
    )
  }
}