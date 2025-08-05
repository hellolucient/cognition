import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

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

    const { count = 1, expiresInDays } = await request.json()

    if (count > 10) {
      return NextResponse.json(
        { error: 'Cannot generate more than 10 codes at once' },
        { status: 400 }
      )
    }

    // Check user's existing code count to prevent abuse
    const existingCodes = await prisma.inviteCode.count({
      where: {
        createdById: user.id,
        isActive: true,
        usedAt: null,
      }
    })

    if (existingCodes + count > 20) {
      return NextResponse.json(
        { error: 'You have too many unused invite codes. Maximum 20 active codes per user.' },
        { status: 429 }
      )
    }

    const codes = []
    const expiresAt = expiresInDays ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000) : null

    for (let i = 0; i < count; i++) {
      let code = generateInviteCode()
      
      // Ensure uniqueness
      while (await prisma.inviteCode.findUnique({ where: { code } })) {
        code = generateInviteCode()
      }

      const inviteCode = await prisma.inviteCode.create({
        data: {
          code,
          createdById: user.id,
          expiresAt,
        }
      })

      codes.push(inviteCode)
    }

    return NextResponse.json({
      success: true,
      codes: codes.map(c => ({
        id: c.id,
        code: c.code,
        createdAt: c.createdAt,
        expiresAt: c.expiresAt,
      }))
    })

  } catch (error: any) {
    console.error('Error generating invite codes:', error)
    return NextResponse.json(
      { error: 'Failed to generate invite codes' },
      { status: 500 }
    )
  }
}