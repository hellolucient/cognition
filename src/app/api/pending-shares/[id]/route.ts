import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';

// GET /api/pending-shares/[id] - Get a specific pending share
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pendingShare = await prisma.pendingShare.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!pendingShare) {
      return NextResponse.json({ error: 'Pending share not found' }, { status: 404 });
    }

    return NextResponse.json({ pendingShare });
  } catch (error) {
    console.error('Error fetching pending share:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending share' },
      { status: 500 }
    );
  }
}

// PATCH /api/pending-shares/[id] - Update a pending share
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { status, title, notes } = body;

    // Validate status if provided
    if (status && !['pending', 'completed', 'cancelled'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const updateData: any = {};
    if (status !== undefined) {
      updateData.status = status;
      if (status === 'completed') {
        updateData.completedAt = new Date();
      }
    }
    if (title !== undefined) updateData.title = title;
    if (notes !== undefined) updateData.notes = notes;

    const pendingShare = await prisma.pendingShare.updateMany({
      where: {
        id: params.id,
        userId: user.id,
      },
      data: updateData,
    });

    if (pendingShare.count === 0) {
      return NextResponse.json({ error: 'Pending share not found' }, { status: 404 });
    }

    // Fetch the updated record to return
    const updatedShare = await prisma.pendingShare.findUnique({
      where: { id: params.id },
    });

    return NextResponse.json({ 
      pendingShare: updatedShare,
      message: status === 'completed' ? 'Marked as completed!' : 'Updated successfully!'
    });
  } catch (error) {
    console.error('Error updating pending share:', error);
    return NextResponse.json(
      { error: 'Failed to update pending share' },
      { status: 500 }
    );
  }
}

// DELETE /api/pending-shares/[id] - Delete a pending share
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const deletedShare = await prisma.pendingShare.deleteMany({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (deletedShare.count === 0) {
      return NextResponse.json({ error: 'Pending share not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Pending share deleted successfully' });
  } catch (error) {
    console.error('Error deleting pending share:', error);
    return NextResponse.json(
      { error: 'Failed to delete pending share' },
      { status: 500 }
    );
  }
}