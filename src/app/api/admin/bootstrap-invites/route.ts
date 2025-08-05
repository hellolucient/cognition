import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Generate a random invite code
function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export async function POST(request: NextRequest) {
  try {
    // Simple admin protection
    const { adminKey } = await request.json()
    
    if (adminKey !== process.env.ADMIN_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all users who don't have invite codes yet
    const usersWithoutCodes = await prisma.user.findMany({
      where: {
        generatedCodes: {
          none: {}
        }
      }
    })

    let totalGenerated = 0

    for (const user of usersWithoutCodes) {
      // Generate 5 codes for each user
      for (let i = 0; i < 5; i++) {
        let code = generateInviteCode()
        
        // Ensure uniqueness
        while (await prisma.inviteCode.findUnique({ where: { code } })) {
          code = generateInviteCode()
        }

        await prisma.inviteCode.create({
          data: {
            code,
            createdById: user.id,
          }
        })

        totalGenerated++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Generated ${totalGenerated} invite codes for ${usersWithoutCodes.length} users`,
      usersProcessed: usersWithoutCodes.length,
      codesGenerated: totalGenerated,
    })

  } catch (error: any) {
    console.error('Error bootstrapping invite codes:', error)
    return NextResponse.json(
      { error: 'Failed to bootstrap invite codes' },
      { status: 500 }
    )
  }
}