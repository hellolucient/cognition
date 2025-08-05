import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { encryptApiKey, validateApiKey } from '@/lib/encryption';
import { AIProvider } from '@/lib/ai-providers';

const prisma = new PrismaClient();

// Save or update API key
export async function POST(request: NextRequest) {
  try {
    const { apiKey, provider } = await request.json();

    if (!apiKey || !provider) {
      return NextResponse.json(
        { error: 'API key and provider are required' },
        { status: 400 }
      );
    }

    // Validate provider
    if (!['openai', 'anthropic', 'google'].includes(provider)) {
      return NextResponse.json(
        { error: 'Invalid provider. Must be openai, anthropic, or google' },
        { status: 400 }
      );
    }

    // Validate API key format
    if (!validateApiKey(apiKey, provider as AIProvider)) {
      return NextResponse.json(
        { error: `Invalid ${provider} API key format` },
        { status: 400 }
      );
    }

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

    // Encrypt the API key
    const encryptedKey = encryptApiKey(apiKey);

    // Determine which field to update based on provider
    const updateData: any = {};
    const createData: any = {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name || user.email?.split('@')[0] || 'Anonymous',
      avatarUrl: user.user_metadata?.avatar_url,
    };

    switch (provider) {
      case 'openai':
        updateData.encryptedOpenAIKey = encryptedKey;
        createData.encryptedOpenAIKey = encryptedKey;
        break;
      case 'anthropic':
        updateData.encryptedAnthropicKey = encryptedKey;
        createData.encryptedAnthropicKey = encryptedKey;
        break;
      case 'google':
        updateData.encryptedGoogleKey = encryptedKey;
        createData.encryptedGoogleKey = encryptedKey;
        break;
    }

    // Save to database (upsert user if needed)
    await prisma.user.upsert({
      where: { id: user.id },
      update: updateData,
      create: createData
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error saving API key:', error);
    return NextResponse.json(
      { error: 'Failed to save API key' },
      { status: 500 }
    );
  }
}

// Remove API key
export async function DELETE(request: NextRequest) {
  try {
    const { provider } = await request.json();

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider is required' },
        { status: 400 }
      );
    }

    // Validate provider
    if (!['openai', 'anthropic', 'google'].includes(provider)) {
      return NextResponse.json(
        { error: 'Invalid provider. Must be openai, anthropic, or google' },
        { status: 400 }
      );
    }

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

    // Determine which field to clear based on provider
    const updateData: any = {};
    switch (provider) {
      case 'openai':
        updateData.encryptedOpenAIKey = null;
        break;
      case 'anthropic':
        updateData.encryptedAnthropicKey = null;
        break;
      case 'google':
        updateData.encryptedGoogleKey = null;
        break;
    }

    // Remove API key from database
    await prisma.user.update({
      where: { id: user.id },
      data: updateData
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error removing API key:', error);
    return NextResponse.json(
      { error: 'Failed to remove API key' },
      { status: 500 }
    );
  }
}