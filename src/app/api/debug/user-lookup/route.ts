import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Check if service role key is available
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ 
        error: 'Service role key not configured', 
        needsServiceKey: true,
        message: 'Add SUPABASE_SERVICE_ROLE_KEY to environment variables'
      });
    }

    // Use Supabase Admin API to check user (no auth required for this debug endpoint)
    const cookieStore = await cookies();
    const adminSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value; },
          set(name: string, value: string, options: any) { cookieStore.set({ name, value, ...options }); },
          remove(name: string, options: any) { cookieStore.set({ name, value: '', ...options }); },
        },
      }
    );

    // Look up user by email using admin client
    const { data: userData, error: userError } = await adminSupabase.auth.admin.listUsers();

    if (userError) {
      return NextResponse.json({ 
        error: 'Failed to lookup users', 
        details: userError.message,
        needsServiceKey: !process.env.SUPABASE_SERVICE_ROLE_KEY 
      });
    }

    const targetUser = userData.users.find(u => u.email?.toLowerCase() === email.toLowerCase());

    return NextResponse.json({
      found: !!targetUser,
      user: targetUser ? {
        id: targetUser.id,
        email: targetUser.email,
        email_confirmed_at: targetUser.email_confirmed_at,
        created_at: targetUser.created_at,
        confirmed: !!targetUser.email_confirmed_at,
        last_sign_in_at: targetUser.last_sign_in_at,
        app_metadata: targetUser.app_metadata,
        user_metadata: targetUser.user_metadata,
      } : null,
      totalUsers: userData.users.length,
    });

  } catch (error: any) {
    console.error('User lookup error:', error);
    return NextResponse.json(
      { error: 'Failed to lookup user', details: error.message },
      { status: 500 }
    );
  }
}
