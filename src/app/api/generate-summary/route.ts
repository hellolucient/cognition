import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Enable Edge Runtime for faster cold starts
export const runtime = 'edge'

export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json()

    // Get the selected platform provider
    const platformProvider = process.env.PLATFORM_AI_PROVIDER || 'openai';
    
    // Check if the selected provider has an API key
    const hasApiKey = {
      openai: !!process.env.OPENAI_API_KEY,
      anthropic: !!process.env.ANTHROPIC_API_KEY,
      google: !!process.env.GOOGLE_API_KEY
    }[platformProvider];

    if (!hasApiKey) {
      return NextResponse.json(
        { error: `Platform ${platformProvider} API key not configured` },
        { status: 500 }
      )
    }

    if (!content) {
      return NextResponse.json(
        { error: 'Conversation content is required' },
        { status: 400 }
      )
    }

    try {
      // Generate title and summary using the selected platform provider
      let result = { title: '', summary: '' };

      if (platformProvider === 'openai') {
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
        const model = process.env.SUMMARY_MODEL || 'gpt-4o-mini';
        result = await generateWithOpenAI(openai, model, content);
        
      } else if (platformProvider === 'anthropic') {
        const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
        result = await generateWithAnthropic(anthropic, content);
        
      } else if (platformProvider === 'google') {
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
        result = await generateWithGoogle(genAI, content);
      }

      return NextResponse.json({ 
        title: result.title.trim(),
        summary: result.summary.trim(),
        provider: platformProvider,
        model: getModelName(platformProvider)
      });

    } catch (error: any) {
      console.error(`Failed with ${platformProvider}:`, error.message);
      
      // Fallback: Create a simple title and summary from the content
      console.log('Using fallback title/summary generation due to API issues');
      const fallbackSummary = content.length > 200 
        ? `${content.substring(0, 200).trim()}...` 
        : content.trim();
      
      // Generate a simple title from the first line or topic
      const firstLine = content.split('\n')[0]?.trim() || '';
      const fallbackTitle = firstLine.length > 50 
        ? `${firstLine.substring(0, 50).trim()}...`
        : firstLine || 'AI Conversation';
      
      return NextResponse.json({ 
        title: fallbackTitle,
        summary: `[AI Summary temporarily unavailable] ${fallbackSummary}`,
        fallback: true,
        provider: platformProvider
      });
    }

  } catch (error: any) {
    console.error('Error generating summary:', error)
    
    if (error.code === 'invalid_api_key') {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to generate summary' },
      { status: 500 }
    )
  }
}

// Helper function for OpenAI
async function generateWithOpenAI(openai: OpenAI, model: string, content: string) {
  const systemPrompt = `You are an expert at analyzing and summarizing AI conversation transcripts. Your job is to create both a compelling title and an engaging summary for the conversation.

IMPORTANT INSTRUCTIONS:
1. READ THE ENTIRE CONVERSATION from start to finish
2. Identify the main topic(s), questions asked, and problems solved
3. Focus on the most interesting or valuable parts of the discussion
4. Write for an audience who wants to know if this conversation is worth reading

RESPONSE FORMAT - Return JSON with exactly this structure:
{
  "title": "Your generated title here",
  "summary": "Your generated summary here"
}

TITLE REQUIREMENTS:
- 3-8 words maximum
- Capture the main topic or achievement
- Make it clickable and intriguing
- Don't use generic words like "conversation" or "discussion"
- Examples: "Building AI Social Platform", "Debugging React Performance", "Creating Custom CSS Animation"

SUMMARY REQUIREMENTS:
- 2-3 sentences maximum
- ALWAYS end with complete sentences (never cut off mid-thought)
- Focus on WHAT was discussed and WHAT was accomplished
- Make it engaging and specific (avoid generic phrases)
- Don't mention "the user asked" or "the AI responded" - just describe the content
- If it's technical, briefly explain what was built/solved
- If it's creative, mention the type of content created
- If it's problem-solving, mention what problem was tackled

Write compelling content that would make someone want to read this conversation.`;

  const response = await openai.chat.completions.create({
    model: model,
    max_tokens: 400,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `CONVERSATION TRANSCRIPT:\n${content}` }
    ],
    temperature: 0.7,
  });

  const responseText = response.choices[0]?.message?.content?.trim();
  if (!responseText) throw new Error('No response generated');

  return parseAIResponse(responseText);
}

// Helper function for Anthropic
async function generateWithAnthropic(anthropic: Anthropic, content: string) {
  const prompt = `You are an expert at analyzing and summarizing AI conversation transcripts. Create both a compelling title and an engaging summary for this conversation.

Return JSON with exactly this structure:
{
  "title": "Your generated title here",
  "summary": "Your generated summary here"
}

TITLE: 3-8 words maximum, capture the main topic, make it clickable and intriguing.
SUMMARY: 2-3 sentences maximum, focus on what was discussed and accomplished.

CONVERSATION TRANSCRIPT:
${content}`;

  const response = await anthropic.messages.create({
    model: 'claude-3-haiku-20240307',
    max_tokens: 400,
    messages: [{ role: 'user', content: prompt }],
  });

  const responseText = response.content[0]?.type === 'text' ? response.content[0].text : '';
  if (!responseText) throw new Error('No response generated');

  return parseAIResponse(responseText);
}

// Helper function for Google
async function generateWithGoogle(genAI: GoogleGenerativeAI, content: string) {
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  
  const prompt = `You are an expert at analyzing and summarizing AI conversation transcripts. Create both a compelling title and an engaging summary for this conversation.

Return JSON with exactly this structure:
{
  "title": "Your generated title here",
  "summary": "Your generated summary here"
}

TITLE: 3-8 words maximum, capture the main topic, make it clickable and intriguing.
SUMMARY: 2-3 sentences maximum, focus on what was discussed and accomplished.

CONVERSATION TRANSCRIPT:
${content}`;

  const response = await model.generateContent(prompt);
  const responseText = response.response.text();
  if (!responseText) throw new Error('No response generated');

  return parseAIResponse(responseText);
}

// Helper function to parse AI responses
function parseAIResponse(responseText: string) {
  try {
    return JSON.parse(responseText);
  } catch (parseError) {
    // Fallback if AI doesn't return proper JSON
    console.warn('AI did not return proper JSON, using fallback parsing');
    const lines = responseText.split('\n').filter(line => line.trim());
    return {
      title: lines[0]?.replace(/^title:?\s*/i, '').trim() || 'AI Conversation',
      summary: lines.slice(1).join(' ').replace(/^summary:?\s*/i, '').trim() || responseText
    };
  }
}

// Helper function to get model name
function getModelName(provider: string) {
  switch (provider) {
    case 'openai':
      return process.env.SUMMARY_MODEL || 'gpt-4o-mini';
    case 'anthropic':
      return 'claude-3-haiku-20240307';
    case 'google':
      return 'gemini-pro';
    default:
      return 'unknown';
  }
}