import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    
    // Log all cookies
    const allCookies = cookieStore.getAll();
    console.log('All cookies:', allCookies.map(c => ({ name: c.name, hasValue: !!c.value })));
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            const value = cookieStore.get(name)?.value;
            console.log(`Cookie get: ${name} = ${value ? 'present' : 'missing'}`);
            return value;
          },
          set(name: string, value: string, options: any) {
            console.log(`Cookie set: ${name}`);
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            console.log(`Cookie remove: ${name}`);
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );

    // Get user from Supabase
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('Supabase user:', user ? { id: user.id, email: user.email } : 'null');
    console.log('Supabase user error:', userError);

    // Try to find user in database
    let dbUser = null;
    let dbUserError = null;
    
    if (user) {
      try {
        dbUser = await prisma.user.findUnique({
          where: { id: user.id },
        });
        console.log('DB user:', dbUser ? { id: dbUser.id, email: dbUser.email } : 'null');
      } catch (error) {
        dbUserError = error;
        console.log('DB user error:', error);
      }
    }

    // Test a simple pending shares query
    let pendingSharesTest = null;
    let pendingSharesError = null;
    
    if (user) {
      try {
        pendingSharesTest = await prisma.pendingShare.count({
          where: { userId: user.id }
        });
        console.log('Pending shares count:', pendingSharesTest);
      } catch (error) {
        pendingSharesError = error;
        console.log('Pending shares error:', error);
      }
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      cookies: allCookies.map(c => ({ name: c.name, hasValue: !!c.value })),
      supabaseAuth: {
        user: user ? { id: user.id, email: user.email, aud: user.aud } : null,
        error: userError
      },
      database: {
        user: dbUser ? { id: dbUser.id, email: dbUser.email } : null,
        error: dbUserError?.message || null,
        pendingSharesCount: pendingSharesTest,
        pendingSharesError: pendingSharesError?.message || null
      },
      environment: {
        SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        DATABASE_URL: !!process.env.DATABASE_URL
      }
    });

  } catch (error: any) {
    console.error('Debug auth session error:', error);
    return NextResponse.json({
      error: 'Debug failed',
      message: error.message,
      stack: error.stack
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
