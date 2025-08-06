import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey } from '@/lib/encryption';
import { AIProvider } from '@/lib/ai-providers';

export async function POST(request: NextRequest) {
  try {
    const { apiKey: rawApiKey, provider } = await request.json();

    if (!rawApiKey || !provider) {
      return NextResponse.json({
        error: 'Missing apiKey or provider',
        received: { apiKey: !!rawApiKey, provider }
      });
    }

    // Clean the API key - remove whitespace, line breaks, and invisible characters
    const apiKey = rawApiKey.trim().replace(/[\r\n\t\s]/g, '');
    const isValid = validateApiKey(apiKey, provider as AIProvider);

    return NextResponse.json({
      success: true,
      validation: {
        isValid,
        provider,
        rawKeyLength: rawApiKey.length,
        cleanedKeyLength: apiKey.length,
        rawKeyPrefix: rawApiKey.substring(0, 10) + '...',
        cleanedKeyPrefix: apiKey.substring(0, 10) + '...',
        containedWhitespace: rawApiKey !== apiKey,
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