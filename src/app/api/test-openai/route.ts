import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function POST(request: NextRequest) {
  try {
    const { apiKey } = await request.json()

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      )
    }

    const openai = new OpenAI({
      apiKey: apiKey,
    })

    // Test 1: Simple completion with minimal tokens
    const testResults: any = {
      timestamp: new Date().toISOString(),
      apiKey: `${apiKey.substring(0, 8)}...${apiKey.slice(-4)}`,
      tests: []
    }

    // Test different models
    const modelsToTest = ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo', 'gpt-4'];

    for (const model of modelsToTest) {
      const testStart = Date.now();
      try {
        const response = await openai.chat.completions.create({
          model: model,
          messages: [
            {
              role: 'user',
              content: 'Say "OK"'
            }
          ],
          max_tokens: 5,
          temperature: 0,
        });

        testResults.tests.push({
          model: model,
          status: 'SUCCESS',
          duration: Date.now() - testStart,
          response: response.choices[0]?.message?.content,
          usage: response.usage,
        });

        // If one model works, we don't need to test them all
        break;

      } catch (error: any) {
        testResults.tests.push({
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

    // Test 2: Check models list (if any model worked)
    if (testResults.tests.some((t: any) => t.status === 'SUCCESS')) {
      try {
        const models = await openai.models.list();
        testResults.availableModels = models.data.map((m: any) => m.id).sort();
      } catch (error: any) {
        testResults.modelsListError = error.message;
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