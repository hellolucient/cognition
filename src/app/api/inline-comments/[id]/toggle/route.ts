import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import prisma from '@/lib/prisma';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { authorization } = request.headers;
    if (!authorization) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    const token = authorization.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const resolvedParams = await params;
    const inlineCommentId = resolvedParams.id;

    // Get the inline contribution
    const inlineContribution = await prisma.inlineContribution.findUnique({
      where: { id: inlineCommentId }
    });

    if (!inlineContribution) {
      return NextResponse.json({ error: 'Inline contribution not found' }, { status: 404 });
    }

    // Toggle collapse state
    const updatedContribution = await prisma.inlineContribution.update({
      where: { id: inlineCommentId },
      data: {
        isCollapsed: !inlineContribution.isCollapsed
      }
    });

    return NextResponse.json({ 
      isCollapsed: updatedContribution.isCollapsed 
    });
  } catch (error) {
    console.error('Error toggling inline comment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
