import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );

    // Test Supabase auth resend confirmation
    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
    });

    return NextResponse.json({
      success: !error,
      data,
      error: error?.message,
      supabaseConfig: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
      }
    });

  } catch (error: any) {
    console.error('Email test error:', error);
    return NextResponse.json(
      { error: 'Failed to test email', details: error.message },
      { status: 500 }
    );
  }
}

// GET endpoint to check email configuration
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );

    // Get current user (if any)
    const { data: { user } } = await supabase.auth.getUser();

    return NextResponse.json({
      environment: {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        nodeEnv: process.env.NODE_ENV,
      },
      currentUser: user ? {
        id: user.id,
        email: user.email,
        emailConfirmed: user.email_confirmed_at,
        createdAt: user.created_at,
      } : null,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('Email config check error:', error);
    return NextResponse.json(
      { error: 'Failed to check email config', details: error.message },
      { status: 500 }
    );
  }
}
