import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json()

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'Platform OpenAI API key not configured' },
        { status: 500 }
      )
    }

    if (!content) {
      return NextResponse.json(
        { error: 'Conversation content is required' },
        { status: 400 }
      )
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    // Get admin-configured model or use default
    const model = process.env.SUMMARY_MODEL || 'gpt-4o-mini';

    try {
      const response = await openai.chat.completions.create({
        model: model,
        max_tokens: 300,
        messages: [
          {
            role: 'system',
            content: `You are an expert at analyzing and summarizing AI conversation transcripts. Your job is to create an engaging, informative summary that captures the essence of what happened in this conversation.

IMPORTANT INSTRUCTIONS:
1. READ THE ENTIRE CONVERSATION from start to finish
2. Identify the main topic(s), questions asked, and problems solved
3. Focus on the most interesting or valuable parts of the discussion
4. Write for an audience who wants to know if this conversation is worth reading

SUMMARY REQUIREMENTS:
- 2-3 sentences maximum
- ALWAYS end with complete sentences (never cut off mid-thought)
- Focus on WHAT was discussed and WHAT was accomplished
- Make it engaging and specific (avoid generic phrases)
- Don't mention "the user asked" or "the AI responded" - just describe the content
- If it's technical, briefly explain what was built/solved
- If it's creative, mention the type of content created
- If it's problem-solving, mention what problem was tackled

Write a compelling summary that would make someone want to read this conversation.`
          },
          {
            role: 'user',
            content: `CONVERSATION TRANSCRIPT:
${content}`
          }
        ],
        temperature: 0.7,
      });

      const summary = response.choices[0]?.message?.content?.trim();

      if (!summary) {
        throw new Error('No summary generated');
      }

      return NextResponse.json({ 
        summary,
        model: model,
        usage: response.usage 
      });

    } catch (error: any) {
      console.error(`Failed with model ${model}:`, error.message);
      
      // Fallback: Create a simple summary from the first 200 characters
      console.log('Using fallback summary generation due to API issues');
      const fallbackSummary = content.length > 200 
        ? `${content.substring(0, 200).trim()}...` 
        : content.trim();
      
      return NextResponse.json({ 
        summary: `[AI Summary temporarily unavailable] ${fallbackSummary}`,
        fallback: true 
      });
    }

  } catch (error: any) {
    console.error('Error generating summary:', error)
    
    if (error.code === 'invalid_api_key') {
      return NextResponse.json(
        { error: 'Invalid OpenAI API key' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to generate summary' },
      { status: 500 }
    )
  }
}