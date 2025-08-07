import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';

// GET /api/pending-shares - Get user's pending shares
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
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    const limit = parseInt(searchParams.get('limit') || '50');

    const pendingShares = await prisma.pendingShare.findMany({
      where: {
        userId: user.id,
        status: status,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return NextResponse.json({ pendingShares });
  } catch (error) {
    console.error('Error fetching pending shares:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending shares' },
      { status: 500 }
    );
  }
}

// POST /api/pending-shares - Create a new pending share
export async function POST(request: NextRequest) {
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
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { url, title, notes } = body;

    // Basic URL validation
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Valid URL is required' }, { status: 400 });
    }

    // Validate it's a ChatGPT URL
    const isValidChatGPTUrl = url.includes('chatgpt.com') || url.includes('chat.openai.com');
    if (!isValidChatGPTUrl) {
      return NextResponse.json({ 
        error: 'Please provide a valid ChatGPT share URL' 
      }, { status: 400 });
    }

    // Check if this URL already exists for this user and is pending
    const existingShare = await prisma.pendingShare.findFirst({
      where: {
        userId: user.id,
        url: url,
        status: 'pending',
      },
    });

    if (existingShare) {
      return NextResponse.json({ 
        error: 'This ChatGPT conversation is already saved in your pending list' 
      }, { status: 409 });
    }

    // Create the pending share
    const pendingShare = await prisma.pendingShare.create({
      data: {
        url,
        title: title || null,
        notes: notes || null,
        userId: user.id,
      },
    });

    return NextResponse.json({ 
      pendingShare,
      message: 'ChatGPT conversation saved! You can now access it from your desktop.' 
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating pending share:', error);
    return NextResponse.json(
      { error: 'Failed to save ChatGPT conversation' },
      { status: 500 }
    );
  }
}