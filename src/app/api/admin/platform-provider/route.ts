import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { provider } = await request.json();

    if (!provider || !['openai', 'anthropic', 'google'].includes(provider)) {
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

    // Simple admin check - you should update this with your email
    const isAdmin = user.email === 'trent.munday@gmail.com'; // TODO: Update this
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Check if the provider has an API key configured
    const hasApiKey = {
      openai: !!process.env.OPENAI_API_KEY,
      anthropic: !!process.env.ANTHROPIC_API_KEY,
      google: !!process.env.GOOGLE_API_KEY
    }[provider];

    if (!hasApiKey) {
      return NextResponse.json(
        { error: `No API key configured for ${provider}. Please add ${provider.toUpperCase()}_API_KEY to your environment variables.` },
        { status: 400 }
      );
    }

    // Update the .env file
    try {
      const envPath = path.join(process.cwd(), '.env');
      let envContent = '';
      
      if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8');
      }

      // Update or add PLATFORM_AI_PROVIDER
      const providerRegex = /^PLATFORM_AI_PROVIDER=.*$/m;
      const newProviderLine = `PLATFORM_AI_PROVIDER=${provider}`;

      if (providerRegex.test(envContent)) {
        envContent = envContent.replace(providerRegex, newProviderLine);
      } else {
        envContent += `\n${newProviderLine}\n`;
      }

      fs.writeFileSync(envPath, envContent);

      // Note: The environment variable won't be updated in the current process
      // until restart, but we can return success
      return NextResponse.json({ 
        success: true,
        message: `Platform AI provider updated to ${provider}. Changes will take effect on next deployment.`
      });

    } catch (fileError) {
      console.error('Error updating .env file:', fileError);
      return NextResponse.json(
        { error: 'Failed to update environment configuration' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error updating platform provider:', error);
    return NextResponse.json(
      { error: 'Failed to update platform provider' },
      { status: 500 }
    );
  }
}