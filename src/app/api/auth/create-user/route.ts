import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'

// POST /api/auth/create-user - Create user in database after email signup
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
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Check if user already exists in database
    const existingUser = await prisma.user.findUnique({
      where: { id: user.id }
    })

    if (existingUser) {
      return NextResponse.json({ 
        success: true, 
        message: 'User already exists',
        user: existingUser 
      })
    }

    // Create user in database
    const newUser = await prisma.user.create({
      data: {
        id: user.id,
        email: user.email!,
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'Anonymous',
        avatarUrl: user.user_metadata?.avatar_url || null,
        // Email signups don't have invite codes
        inviteCode: null,
        invitedById: null,
      }
    })

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
      }
    })

  } catch (error: any) {
    console.error('Error creating user:', error)
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}
