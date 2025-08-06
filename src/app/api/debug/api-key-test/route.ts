import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey } from '@/lib/encryption';
import { AIProvider } from '@/lib/ai-providers';

export async function POST(request: NextRequest) {
  try {
    const { apiKey, provider } = await request.json();

    if (!apiKey || !provider) {
      return NextResponse.json({
        error: 'Missing apiKey or provider',
        received: { apiKey: !!apiKey, provider }
      });
    }

    const isValid = validateApiKey(apiKey, provider as AIProvider);

    return NextResponse.json({
      success: true,
      validation: {
        isValid,
        provider,
        keyLength: apiKey.length,
        keyPrefix: apiKey.substring(0, 10) + '...',
        keyPattern: {
          openai: /^sk-[a-zA-Z0-9_\-]{20,}$/.test(apiKey),
          anthropic: /^sk-ant-[a-zA-Z0-9\-_]{95,}$/.test(apiKey),
          google: /^[a-zA-Z0-9\-_]{35,45}$/.test(apiKey)
        }
      }
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}