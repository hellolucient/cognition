import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'text';

    // Fetch the thread with all contributions
    const thread = await prisma.thread.findUnique({
      where: { id },
      include: {
        author: {
          select: { name: true, email: true }
        },
        contributions: {
          include: {
            author: {
              select: { name: true, email: true }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    // Generate export content based on format
    let exportContent = '';
    let contentType = 'text/plain';
    let fileExtension = 'txt';

    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    // Use the actual title or generate one from summary as fallback
    const threadTitle = thread.title || 
      (thread.summary 
        ? thread.summary.substring(0, 50).replace(/[^\w\s]/g, '').trim() + (thread.summary.length > 50 ? '...' : '')
        : 'AI Conversation');

    switch (format) {
      case 'markdown':
        contentType = 'text/markdown';
        fileExtension = 'md';
        
        exportContent = `# ${threadTitle}\n\n`;
        exportContent += `**Posted by:** ${thread.author?.name || 'Anonymous'}\n`;
        exportContent += `**Date:** ${formatDate(thread.createdAt)}\n`;
        exportContent += `**Source:** ${thread.source}\n\n`;
        
        if (thread.summary) {
          exportContent += `## Summary\n\n${thread.summary}\n\n`;
        }
        
        exportContent += `## Original Conversation\n\n`;
        exportContent += `${thread.content}\n\n`;
        
        if (thread.contributions && thread.contributions.length > 0) {
          exportContent += `## Community Contributions\n\n`;
          
          thread.contributions.forEach((contribution, index) => {
            exportContent += `### Contribution ${index + 1}\n\n`;
            exportContent += `**By:** ${contribution.author?.name || 'Anonymous'}\n`;
            exportContent += `**Date:** ${formatDate(contribution.createdAt)}\n`;
            
            if (contribution.referencedText && contribution.referencedSource) {
              exportContent += `**Replying to:** ${contribution.referencedSource}\n`;
              exportContent += `> ${contribution.referencedText}\n\n`;
            }
            
            exportContent += `${contribution.content}\n\n`;
            exportContent += `---\n\n`;
          });
        }
        break;

      case 'json':
        contentType = 'application/json';
        fileExtension = 'json';
        
        const jsonData = {
          id: thread.id,
          title: threadTitle,
          summary: thread.summary,
          source: thread.source,
          tags: thread.tags,
          createdAt: thread.createdAt,
          author: {
            name: thread.author?.name || 'Anonymous',
            email: thread.author?.email
          },
          originalContent: thread.content,
          contributions: thread.contributions?.map(contribution => ({
            id: contribution.id,
            content: contribution.content,
            source: contribution.source,
            createdAt: contribution.createdAt,
            author: {
              name: contribution.author?.name || 'Anonymous',
              email: contribution.author?.email
            },
            referencedText: contribution.referencedText,
            referencedSource: contribution.referencedSource
          })) || []
        };
        
        exportContent = JSON.stringify(jsonData, null, 2);
        break;

      default: // text format
        exportContent = `${threadTitle}\n`;
        exportContent += `${'='.repeat(threadTitle.length)}\n\n`;
        exportContent += `Posted by: ${thread.author?.name || 'Anonymous'}\n`;
        exportContent += `Date: ${formatDate(thread.createdAt)}\n`;
        exportContent += `Source: ${thread.source}\n\n`;
        
        if (thread.summary) {
          exportContent += `SUMMARY:\n${thread.summary}\n\n`;
        }
        
        exportContent += `ORIGINAL CONVERSATION:\n`;
        exportContent += `${'-'.repeat(50)}\n`;
        exportContent += `${thread.content}\n\n`;
        
        if (thread.contributions && thread.contributions.length > 0) {
          exportContent += `COMMUNITY CONTRIBUTIONS:\n`;
          exportContent += `${'-'.repeat(50)}\n\n`;
          
          thread.contributions.forEach((contribution, index) => {
            exportContent += `CONTRIBUTION ${index + 1}:\n`;
            exportContent += `By: ${contribution.author?.name || 'Anonymous'}\n`;
            exportContent += `Date: ${formatDate(contribution.createdAt)}\n`;
            
            if (contribution.referencedText && contribution.referencedSource) {
              exportContent += `Replying to (${contribution.referencedSource}): "${contribution.referencedText}"\n`;
            }
            
            exportContent += `\n${contribution.content}\n\n`;
            exportContent += `${'-'.repeat(30)}\n\n`;
          });
        }
        break;
    }

    // Generate filename
    const sanitizedTitle = threadTitle
      .replace(/[^a-zA-Z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .toLowerCase()
      .substring(0, 50);
    
    const dateStr = thread.createdAt.toISOString().split('T')[0];
    const filename = `${sanitizedTitle}-${dateStr}.${fileExtension}`;

    // Return the file
    return new NextResponse(exportContent, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Failed to export thread' },
      { status: 500 }
    );
  }
}