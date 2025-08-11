import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
  log: ['error'],
})

function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

async function getUser() {
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
  const { data } = await supabase.auth.getUser()
  return data.user
}

function isAdminEmail(email?: string | null) {
  const configured = process.env.ADMIN_EMAIL?.toLowerCase()
  return !!email && (!!configured ? email.toLowerCase() === configured : email.toLowerCase() === 'trent.munday@gmail.com')
}

export async function GET(_request: NextRequest) {
  try {
    const user = await getUser()
    if (!user || !isAdminEmail(user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const entries = await prisma.waitlistEntry.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: { id: true, email: true, message: true, createdAt: true, notified: true },
    })

    const totals = await prisma.waitlistEntry.aggregate({ _count: true })

    return NextResponse.json({ total: totals._count, entries })
  } catch (error: any) {
    console.error('GET /api/admin/waitlist error:', error)
    return NextResponse.json({ error: 'Failed to fetch waitlist' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user || !isAdminEmail(user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { entryId, count = 1, expiresInDays } = await request.json()
    if (!entryId) {
      return NextResponse.json({ error: 'entryId is required' }, { status: 400 })
    }
    if (count < 1 || count > 5) {
      return NextResponse.json({ error: 'count must be between 1 and 5' }, { status: 400 })
    }

    const entry = await prisma.waitlistEntry.findUnique({ where: { id: entryId } })
    if (!entry) {
      return NextResponse.json({ error: 'Waitlist entry not found' }, { status: 404 })
    }

    const codes: { id: string; code: string }[] = []
    const expiresAt = expiresInDays ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000) : null

    for (let i = 0; i < count; i++) {
      let code = generateInviteCode()
      while (await prisma.inviteCode.findUnique({ where: { code } })) {
        code = generateInviteCode()
      }
      const created = await prisma.inviteCode.create({
        data: { code, createdById: user.id, expiresAt },
        select: { id: true, code: true },
      })
      codes.push(created)
    }

    await prisma.waitlistEntry.update({ where: { id: entry.id }, data: { notified: true } })

    return NextResponse.json({ success: true, email: entry.email, codes })
  } catch (error: any) {
    console.error('POST /api/admin/waitlist error:', error)
    return NextResponse.json({ error: 'Failed to generate invites' }, { status: 500 })
  }
}


