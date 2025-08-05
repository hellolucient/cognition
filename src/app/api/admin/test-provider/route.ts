import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

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

    // Test the specific provider
    const testPrompt = "Hello! This is a test message. Please respond with 'Test successful!' to confirm the API is working.";

    try {
      let response = '';

      if (provider === 'openai') {
        if (!process.env.OPENAI_API_KEY) {
          throw new Error('OpenAI API key not configured');
        }
        
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const completion = await openai.chat.completions.create({
          model: process.env.SUMMARY_MODEL || 'gpt-4o-mini',
          messages: [{ role: 'user', content: testPrompt }],
          max_tokens: 50,
        });
        response = completion.choices[0]?.message?.content || '';

      } else if (provider === 'anthropic') {
        if (!process.env.ANTHROPIC_API_KEY) {
          throw new Error('Anthropic API key not configured');
        }
        
        const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
        const completion = await anthropic.messages.create({
          model: 'claude-3-haiku-20240307',
          max_tokens: 50,
          messages: [{ role: 'user', content: testPrompt }],
        });
        response = completion.content[0]?.type === 'text' ? completion.content[0].text : '';

      } else if (provider === 'google') {
        if (!process.env.GOOGLE_API_KEY) {
          throw new Error('Google API key not configured');
        }
        
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        const result = await model.generateContent(testPrompt);
        response = result.response.text();
      }

      return NextResponse.json({
        success: true,
        provider,
        response: response.trim(),
        message: `${provider.charAt(0).toUpperCase() + provider.slice(1)} API test successful!`
      });

    } catch (apiError: any) {
      console.error(`${provider} API test failed:`, apiError);
      return NextResponse.json(
        { error: `${provider.charAt(0).toUpperCase() + provider.slice(1)} API test failed: ${apiError.message}` },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Error testing provider:', error);
    return NextResponse.json(
      { error: 'Failed to test provider' },
      { status: 500 }
    );
  }
}