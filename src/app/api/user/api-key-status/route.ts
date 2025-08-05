import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();

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

    // Check if user has encrypted API keys
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { 
        encryptedOpenAIKey: true,
        encryptedAnthropicKey: true,
        encryptedGoogleKey: true
      }
    });

    return NextResponse.json({
      hasOpenAI: !!dbUser?.encryptedOpenAIKey,
      hasAnthropic: !!dbUser?.encryptedAnthropicKey,
      hasGoogle: !!dbUser?.encryptedGoogleKey,
      // Legacy field for backward compatibility
      hasApiKey: !!(dbUser?.encryptedOpenAIKey || dbUser?.encryptedAnthropicKey || dbUser?.encryptedGoogleKey)
    });

  } catch (error) {
    console.error('Error checking API key status:', error);
    return NextResponse.json(
      { error: 'Failed to check API key status' },
      { status: 500 }
    );
  }
}