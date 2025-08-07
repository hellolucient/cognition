import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { decryptApiKey } from '@/lib/encryption'
import { AIProvider } from '@/lib/ai-providers'
import prisma from '@/lib/prisma';

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
          });
          aiResponse = response.choices[0]?.message?.content?.trim() || '';
          
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
          });
          aiResponse = response.content[0]?.type === 'text' ? response.content[0].text : '';
          
        } else if (provider === 'google') {
          const genAI = new GoogleGenerativeAI(userApiKey);
          const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
          const response = await model.generateContent(`You are a helpful AI assistant continuing a conversation. Provide thoughtful, relevant responses that build on the previous discussion.\n\n${contextPrompt}`);
          aiResponse = response.response.text();
        }

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
        source = `AI Contribution (${provider.charAt(0).toUpperCase() + provider.slice(1)})`

        // Generate a summary for the contribution using platform OpenAI key
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
                  content: contributionContent
                }
              ],
              max_tokens: 100,
              temperature: 0.7,
            });

            contributionSummary = summaryResponse.choices[0]?.message?.content?.trim() || 
              `Continued the conversation with: ${userPrompt}`;
          } else {
            contributionSummary = `Continued the conversation with: ${userPrompt}`;
          }

        } catch (summaryError) {
          contributionSummary = `Continued the conversation with: ${userPrompt}`;
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