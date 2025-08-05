import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const prisma = new PrismaClient()

// Generate initial invite codes for new users
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
    const { inviteCode, email, password, name } = await request.json()

    if (!inviteCode || !email || !password) {
      return NextResponse.json(
        { error: 'Invite code, email, and password are required' },
        { status: 400 }
      )
    }

    // Validate invite code first
    const invite = await prisma.inviteCode.findUnique({
      where: { code: inviteCode.trim().toUpperCase() },
      include: { createdBy: true }
    })

    if (!invite || !invite.isActive || invite.usedAt || (invite.expiresAt && invite.expiresAt < new Date())) {
      return NextResponse.json(
        { error: 'Invalid or expired invite code' },
        { status: 400 }
      )
    }

    // Create Supabase client
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

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.toLowerCase().trim(),
      password,
      options: {
        data: {
          name: name?.trim() || null,
          invite_code: invite.code,
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`
      }
    })

    console.log('Supabase signup result:', { authData, authError })

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: authError?.message || 'Failed to create account' },
        { status: 400 }
      )
    }

    // Create user in our database
    const user = await prisma.user.create({
      data: {
        id: authData.user.id,
        email: authData.user.email!,
        name: name?.trim() || null,
        inviteCode: invite.code,
        invitedById: invite.createdById,
      }
    })

    // Mark invite code as used
    await prisma.inviteCode.update({
      where: { id: invite.id },
      data: {
        usedById: user.id,
        usedAt: new Date(),
      }
    })

    // Generate 5 initial invite codes for the new user
    const newCodes = []
    for (let i = 0; i < 5; i++) {
      let code = generateInviteCode()
      
      // Ensure uniqueness
      while (await prisma.inviteCode.findUnique({ where: { code } })) {
        code = generateInviteCode()
      }

      const newInviteCode = await prisma.inviteCode.create({
        data: {
          code,
          createdById: user.id,
        }
      })

      newCodes.push(newInviteCode.code)
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      inviteCodes: newCodes,
      message: 'Account created successfully! You have 5 invite codes to share with friends.'
    })

  } catch (error: any) {
    console.error('Error creating account with invite:', error)
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    )
  }
}