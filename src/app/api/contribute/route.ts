import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { decryptApiKey } from '@/lib/encryption'
import { AIProvider } from '@/lib/ai-providers'

// Note: Using Node.js runtime because we need crypto module for encryption
// export const runtime = 'edge' // Disabled due to crypto dependency

interface StreamingParams {
  provider: AIProvider;
  userApiKey: string;
  contextPrompt: string;
  userPrompt: string;
  parentThreadId: string;
  user: any;
  referencedText?: string;
  referencedSource?: string;
}

async function createStreamingResponse(params: StreamingParams) {
  const { provider, userApiKey, contextPrompt, userPrompt, parentThreadId, user, referencedText, referencedSource } = params;
  
  const encoder = new TextEncoder();
  let fullAiResponse = '';

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Send initial metadata
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
          type: 'start', 
          provider,
          userPrompt 
        })}\n\n`));

        if (provider === 'openai') {
          const openai = new OpenAI({ apiKey: userApiKey });
          const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: 'You are a helpful AI assistant continuing a conversation. Provide thoughtful, relevant responses that build on the previous discussion.'
              },
              {
                role: 'user',
                content: contextPrompt
              }
            ],
            max_tokens: 1000,
            temperature: 0.7,
            stream: true, // Enable streaming
          });

          for await (const chunk of response) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              fullAiResponse += content;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                type: 'content', 
                content 
              })}\n\n`));
            }
          }

        } else if (provider === 'anthropic') {
          const anthropic = new Anthropic({ apiKey: userApiKey });
          const response = await anthropic.messages.create({
            model: 'claude-3-haiku-20240307',
            max_tokens: 1000,
            messages: [
              {
                role: 'user',
                content: `You are a helpful AI assistant continuing a conversation. Provide thoughtful, relevant responses that build on the previous discussion.\n\n${contextPrompt}`
              }
            ],
            stream: true, // Enable streaming for Anthropic
          });

          for await (const chunk of response) {
            if (chunk.type === 'content_block_delta' && chunk.delta?.type === 'text_delta') {
              const content = chunk.delta.text;
              fullAiResponse += content;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                type: 'content', 
                content 
              })}\n\n`));
            }
          }

        } else if (provider === 'google') {
          // Note: Google AI doesn't support streaming in the same way, so we'll use regular generation
          const genAI = new GoogleGenerativeAI(userApiKey);
          const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
          const response = await model.generateContent(`You are a helpful AI assistant continuing a conversation. Provide thoughtful, relevant responses that build on the previous discussion.\n\n${contextPrompt}`);
          const content = response.response.text();
          fullAiResponse = content;
          
          // Simulate streaming by sending chunks
          const words = content.split(' ');
          for (let i = 0; i < words.length; i += 3) {
            const chunk = words.slice(i, i + 3).join(' ') + ' ';
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
              type: 'content', 
              content: chunk 
            })}\n\n`));
            // Small delay to simulate streaming
            await new Promise(resolve => setTimeout(resolve, 50));
          }
        }

        // Save the contribution to database after streaming is complete
        if (fullAiResponse) {
          // Build AI contribution content with reference if provided
          let content = '';
          
          if (referencedText && referencedSource) {
            content += `> ${referencedSource}: "${referencedText}"\n\n`;
          }
          
          content += `Human: ${userPrompt}\n\nAssistant: ${fullAiResponse}`;
          
          // Generate a summary for the contribution
          let contributionSummary = `Continued the conversation with: ${userPrompt}`;
          try {
            if (process.env.OPENAI_API_KEY) {
              const platformOpenAI = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
              const summaryResponse = await platformOpenAI.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                  {
                    role: 'system',
                    content: 'Create a brief 1-2 sentence summary of this conversation contribution.'
                  },
                  {
                    role: 'user',
                    content
                  }
                ],
                max_tokens: 100,
                temperature: 0.7,
              });
              contributionSummary = summaryResponse.choices[0]?.message?.content?.trim() || contributionSummary;
            }
          } catch (summaryError) {
            console.warn('Failed to generate summary:', summaryError);
          }

          // Save to database
          const contribution = await prisma.thread.create({
            data: {
              content,
              summary: contributionSummary,
              source: `AI Contribution (${provider.charAt(0).toUpperCase() + provider.slice(1)})`,
              authorId: user.id,
              parentThreadId: parentThreadId,
              isContribution: true,
              tags: [],
              referencedText: referencedText || null,
              referencedSource: referencedSource || null,
            },
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatarUrl: true,
                },
              },
            },
          });

          // Send completion event with contribution ID
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: 'complete',
            contributionId: contribution.id,
            summary: contributionSummary
          })}\n\n`));
        }

      } catch (error: any) {
        console.error('Streaming error:', error);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
          type: 'error', 
          error: error.message 
        })}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const { type, parentThreadId, userPrompt, manualContent, referencedText, referencedSource, provider, source } = await request.json()

    // Get the authenticated user
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Validation
    if (!parentThreadId) {
      return NextResponse.json(
        { error: 'Parent thread ID is required' },
        { status: 400 }
      )
    }

    if (type !== 'ai' && type !== 'manual') {
      return NextResponse.json(
        { error: 'Invalid contribution type' },
        { status: 400 }
      )
    }

    if (type === 'ai' && !userPrompt?.trim()) {
      return NextResponse.json(
        { error: 'User prompt is required for AI contributions' },
        { status: 400 }
      )
    }

    if (type === 'ai' && !provider) {
      return NextResponse.json(
        { error: 'AI provider is required for AI contributions' },
        { status: 400 }
      )
    }

    if (type === 'manual' && !manualContent?.trim()) {
      return NextResponse.json(
        { error: 'Manual content is required for manual contributions' },
        { status: 400 }
      )
    }

    // Get the parent thread
    const parentThread = await prisma.thread.findUnique({
      where: { id: parentThreadId },
      include: {
        author: {
          select: { name: true }
        }
      }
    })

    if (!parentThread) {
      return NextResponse.json(
        { error: 'Parent thread not found' },
        { status: 404 }
      )
    }

    // Check if user exists in our database, create if not
    let dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { 
        id: true, 
        encryptedOpenAIKey: true,
        encryptedAnthropicKey: true,
        encryptedGoogleKey: true,
        name: true,
        email: true 
      }
    })

    if (!dbUser) {
      dbUser = await prisma.user.create({
        data: {
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'Anonymous',
          avatarUrl: user.user_metadata?.avatar_url,
        },
        select: { 
          id: true, 
          encryptedOpenAIKey: true,
          encryptedAnthropicKey: true,
          encryptedGoogleKey: true,
          name: true,
          email: true 
        }
      })
    }

    // Handle manual contributions
    if (type === 'manual') {
      let content = '';
      
      // Add reference if provided
      if (referencedText && referencedSource) {
        content += `> ${referencedSource}: "${referencedText}"\n\n`;
      }
      
      content += `Human: ${manualContent}`;
      
      const contributionSummary = manualContent.length > 150 
        ? `${manualContent.substring(0, 150)}...` 
        : manualContent;

      const contribution = await prisma.thread.create({
        data: {
          content,
          summary: contributionSummary,
          source: source || 'Manual Contribution', // Use provided source or default
          tags: parentThread.tags, // Inherit tags from parent
          authorId: user.id,
          parentThreadId: parentThreadId,
          isContribution: true,
          referencedText: referencedText || null,
          referencedSource: referencedSource || null,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            }
          },
          _count: {
            select: {
              comments: true,
              upvotes: true,
            }
          }
        }
      })

      return NextResponse.json(contribution);
    }

    // Handle AI contributions with streaming
    if (type === 'ai') {
      // Get the appropriate API key for the provider
      let encryptedKey: string | null = null;
      
      switch (provider) {
        case 'openai':
          encryptedKey = dbUser.encryptedOpenAIKey;
          break;
        case 'anthropic':
          encryptedKey = dbUser.encryptedAnthropicKey;
          break;
        case 'google':
          encryptedKey = dbUser.encryptedGoogleKey;
          break;
        default:
          return NextResponse.json(
            { error: 'Invalid AI provider' },
            { status: 400 }
          )
      }

      if (!encryptedKey) {
        console.log('❌ No encrypted API key found for provider:', provider);
        console.log('🔍 User API keys:', {
          hasOpenAI: !!dbUser.encryptedOpenAIKey,
          hasAnthropic: !!dbUser.encryptedAnthropicKey,
          hasGoogle: !!dbUser.encryptedGoogleKey
        });
        return NextResponse.json(
          { error: `Please add your ${provider} API key in Settings to contribute with AI` },
          { status: 400 }
        )
      }

      try {
        // Decrypt the user's API key
        const userApiKey = decryptApiKey(encryptedKey);

        // Create the full context for the AI
        let contextPrompt = `Here is a conversation that was previously shared on our platform:

ORIGINAL CONVERSATION:
${parentThread.content}

CONVERSATION SUMMARY: ${parentThread.summary}`;

        // Add referenced text if provided
        if (referencedText && referencedSource) {
          contextPrompt += `

REFERENCED TEXT (from ${referencedSource}): "${referencedText}"

Please acknowledge this specific reference in your response and address it directly.`;
        }

        contextPrompt += `

Now, a user wants to continue this conversation with the following prompt. Please respond as if you are continuing the conversation, taking into account all the context from the original discussion${referencedText ? ' and especially the specific text they referenced above' : ''}:

USER'S NEW PROMPT: ${userPrompt}`;

        // Return streaming response
        return createStreamingResponse({
          provider,
          userApiKey,
          contextPrompt,
          userPrompt,
          parentThreadId,
          user,
          referencedText,
          referencedSource
        });

      } catch (error: any) {
        console.error('Error generating AI contribution:', error)
        return NextResponse.json(
          { error: `AI generation failed: ${error.message}` },
          { status: 500 }
        )
      }
    }

  } catch (error: any) {
    console.error('Error creating contribution:', error);
    return NextResponse.json(
      { error: 'Failed to create contribution' },
      { status: 500 }
    );
  }
}