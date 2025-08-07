import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
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

    // Get user's invite codes
    const codes = await prisma.inviteCode.findMany({
      where: {
        createdById: user.id,
      },
      include: {
        usedBy: {
          select: {
            name: true,
            email: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      codes: codes.map(code => ({
        id: code.id,
        code: code.code,
        createdAt: code.createdAt,
        expiresAt: code.expiresAt,
        usedAt: code.usedAt,
        usedBy: code.usedBy,
        isActive: code.isActive,
      }))
    })

  } catch (error: any) {
    console.error('Error fetching invite codes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invite codes' },
      { status: 500 }
    )
  }
}