import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import OpenAI from 'openai'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const { type, parentThreadId, userPrompt, manualContent, userApiKey, referencedText, referencedSource } = await request.json()

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
      where: { id: user.id }
    })

    if (!dbUser) {
      dbUser = await prisma.user.create({
        data: {
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'Anonymous',
          avatarUrl: user.user_metadata?.avatar_url,
        }
      })
    }

    let contributionContent = '';
    let contributionSummary = '';
    let source = '';

    if (type === 'manual') {
      // Manual contribution
      let content = '';
      
      // Add reference if provided
      if (referencedText && referencedSource) {
        content += `> ${referencedSource}: "${referencedText}"\n\n`;
      }
      
      content += `Human: ${manualContent}`;
      contributionContent = content;
      
      contributionSummary = manualContent.length > 150 
        ? `${manualContent.substring(0, 150)}...` 
        : manualContent;
      source = 'Manual Contribution';

    } else {
      // AI contribution
      if (!userApiKey) {
        return NextResponse.json(
          { error: 'OpenAI API key is required for AI contributions' },
          { status: 400 }
        )
      }

      try {
        const openai = new OpenAI({ apiKey: userApiKey })

        // Create the full context for the AI
        let contextPrompt = `Here is a conversation that was previously shared on our platform:

ORIGINAL CONVERSATION:
${parentThread.content}

SUMMARY: ${parentThread.summary}`;

        // Add reference context if provided
        if (referencedText && referencedSource) {
          contextPrompt += `

IMPORTANT: The user is specifically responding to this part of the conversation:
${referencedSource}: "${referencedText}"

Please acknowledge this specific reference in your response and address it directly.`;
        }

        contextPrompt += `

Now, a user wants to continue this conversation with the following prompt. Please respond as if you are continuing the conversation, taking into account all the context from the original discussion${referencedText ? ' and especially the specific text they referenced above' : ''}:

USER'S NEW PROMPT: ${userPrompt}`;

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
        })

        const aiResponse = response.choices[0]?.message?.content?.trim()

        if (!aiResponse) {
          throw new Error('No response from AI')
        }

        // Build AI contribution content with reference if provided
        let content = '';
        
        if (referencedText && referencedSource) {
          content += `> ${referencedSource}: "${referencedText}"\n\n`;
        }
        
        content += `Human: ${userPrompt}\n\nAssistant: ${aiResponse}`;
        contributionContent = content;
        source = 'AI Contribution (User\'s API Key)'

        // Generate a summary for the contribution
        try {
          const summaryResponse = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: 'Create a brief 1-2 sentence summary of this conversation contribution.'
              },
              {
                role: 'user',
                content: contributionContent
              }
            ],
            max_tokens: 100,
            temperature: 0.7,
          })

          contributionSummary = summaryResponse.choices[0]?.message?.content?.trim() || 
            `Continued the conversation with: ${userPrompt}`

        } catch (summaryError) {
          contributionSummary = `Continued the conversation with: ${userPrompt}`
        }

      } catch (error: any) {
        console.error('Error generating AI contribution:', error)
        return NextResponse.json(
          { error: `AI generation failed: ${error.message}` },
          { status: 500 }
        )
      }
    }

    // Create the contribution thread
    const contribution = await prisma.thread.create({
      data: {
        content: contributionContent,
        summary: contributionSummary,
        source: source,
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

    return NextResponse.json(contribution)

  } catch (error: any) {
    console.error('Error creating contribution:', error)
    return NextResponse.json(
      { error: 'Failed to create contribution' },
      { status: 500 }
    )
  }
}