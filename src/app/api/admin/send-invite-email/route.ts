import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import nodemailer from 'nodemailer'

function isAdminEmail(email?: string | null) {
  const configured = process.env.ADMIN_EMAIL?.toLowerCase()
  return !!email && (!!configured ? email.toLowerCase() === configured : email.toLowerCase() === 'trent.munday@gmail.com')
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

export async function POST(req: NextRequest) {
  try {
    const user = await getUser()
    if (!user || !isAdminEmail(user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { toEmail, code } = await req.json()
    if (!toEmail || !code) {
      return NextResponse.json({ error: 'toEmail and code are required' }, { status: 400 })
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const inviteLink = `${siteUrl}?invite=${encodeURIComponent(code)}`

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT || 465),
      secure: String(process.env.SMTP_PORT || 465) === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@example.com'

    const subject = 'Your Cognition Invite Code'
    const text = `Hi,

Here is your Cognition invite code: ${code}

Use it on the Sign Up tab: ${inviteLink}

Thanks!`
    const html = `
      <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; line-height:1.6;">
        <p>Hi,</p>
        <p>Here is your <strong>Cognition</strong> invite code:</p>
        <p style="font-size:20px; font-weight:700; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;">${code}</p>
        <p>
          Use it on the Sign Up tab here:
          <a href="${inviteLink}">${inviteLink}</a>
        </p>
        <p>Thanks!</p>
      </div>
    `

    await transporter.sendMail({ from, to: toEmail, subject, text, html })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error sending invite email:', error)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}


