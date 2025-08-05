import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user
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

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Simple admin check - you should update this with your email
    const isAdmin = user.email === 'trent.munday@gmail.com'; // TODO: Update this
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get current platform provider
    const currentProvider = process.env.PLATFORM_AI_PROVIDER || 'openai';

    // Check which providers have API keys configured
    const availableProviders = {
      openai: {
        available: !!process.env.OPENAI_API_KEY,
        model: process.env.SUMMARY_MODEL || 'gpt-4o-mini'
      },
      anthropic: {
        available: !!process.env.ANTHROPIC_API_KEY,
        model: 'claude-3-haiku-20240307'
      },
      google: {
        available: !!process.env.GOOGLE_API_KEY,
        model: 'gemini-pro'
      }
    };

    return NextResponse.json({
      currentProvider,
      availableProviders
    });

  } catch (error) {
    console.error('Error fetching platform status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch platform status' },
      { status: 500 }
    );
  }
}