import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(request: NextRequest) {
  try {
    const { openaiKey, anthropicKey } = await request.json()

    const testResults: any = {
      timestamp: new Date().toISOString(),
      openai: null,
      anthropic: null,
    }

    // Test OpenAI if key provided
    if (openaiKey) {
      try {
        const openai = new OpenAI({ apiKey: openaiKey })
        
        testResults.openai = {
          apiKey: `${openaiKey.substring(0, 8)}...${openaiKey.slice(-4)}`,
          tests: []
        }

        const openaiModels = ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo', 'gpt-4'];

        for (const model of openaiModels) {
          const testStart = Date.now();
          try {
            const response = await openai.chat.completions.create({
              model: model,
              messages: [{ role: 'user', content: 'Say "OK"' }],
              max_tokens: 5,
              temperature: 0,
            });

            testResults.openai.tests.push({
              model: model,
              status: 'SUCCESS',
              duration: Date.now() - testStart,
              response: response.choices[0]?.message?.content,
              usage: response.usage,
            });

            break; // Stop testing after first success

          } catch (error: any) {
            testResults.openai.tests.push({
              model: model,
              status: 'FAILED',
              duration: Date.now() - testStart,
              error: {
                message: error.message,
                code: error.code,
                type: error.type,
                status: error.status,
              }
            });
          }
        }

        // Get available models if any test succeeded
        if (testResults.openai.tests.some((t: any) => t.status === 'SUCCESS')) {
          try {
            const models = await openai.models.list();
            testResults.openai.availableModels = models.data.map((m: any) => m.id).sort();
          } catch (error: any) {
            testResults.openai.modelsListError = error.message;
          }
        }

      } catch (error: any) {
        testResults.openai = {
          error: 'Failed to initialize OpenAI client',
          details: error.message
        };
      }
    }

    // Test Anthropic if key provided
    if (anthropicKey) {
      try {
        const anthropic = new Anthropic({ apiKey: anthropicKey })
        
        testResults.anthropic = {
          apiKey: `${anthropicKey.substring(0, 8)}...${anthropicKey.slice(-4)}`,
          tests: []
        }

        const anthropicModels = [
          'claude-3-haiku-20240307',
          'claude-3-sonnet-20240229', 
          'claude-3-opus-20240229',
          'claude-3-5-sonnet-20241022'
        ];

        for (const model of anthropicModels) {
          const testStart = Date.now();
          try {
            const response = await anthropic.messages.create({
              model: model,
              max_tokens: 5,
              messages: [{ role: 'user', content: 'Say "OK"' }],
            });

            testResults.anthropic.tests.push({
              model: model,
              status: 'SUCCESS',
              duration: Date.now() - testStart,
              response: response.content[0]?.type === 'text' ? response.content[0].text : 'Non-text response',
              usage: response.usage,
            });

            break; // Stop testing after first success

          } catch (error: any) {
            testResults.anthropic.tests.push({
              model: model,
              status: 'FAILED',
              duration: Date.now() - testStart,
              error: {
                message: error.message,
                type: error.type,
                status: error.status,
              }
            });
          }
        }

      } catch (error: any) {
        testResults.anthropic = {
          error: 'Failed to initialize Anthropic client',
          details: error.message
        };
      }
    }

    return NextResponse.json(testResults);

  } catch (error: any) {
    return NextResponse.json({
      error: 'Test failed',
      details: {
        message: error.message,
        code: error.code,
        type: error.type,
        status: error.status,
      },
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}