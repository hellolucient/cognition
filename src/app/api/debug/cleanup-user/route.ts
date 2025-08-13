import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { email, confirmDelete } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    if (!confirmDelete) {
      return NextResponse.json({ error: 'Must confirm deletion with confirmDelete: true' }, { status: 400 });
    }

    const emailLower = email.toLowerCase().trim();
    const results = {
      email: emailLower,
      deletedFrom: {},
      errors: [],
      timestamp: new Date().toISOString(),
    };

    // 1. Delete from our database tables
    try {
      // Delete invite codes created by this user
      const deletedInviteCodes = await prisma.inviteCode.deleteMany({
        where: { createdBy: { email: emailLower } }
      });
      results.deletedFrom.inviteCodesCreated = deletedInviteCodes.count;

      // Delete invite codes used by this user
      const deletedUsedCodes = await prisma.inviteCode.deleteMany({
        where: { usedBy: { email: emailLower } }
      });
      results.deletedFrom.inviteCodesUsed = deletedUsedCodes.count;

      // Delete pending shares
      const deletedPendingShares = await prisma.pendingShare.deleteMany({
        where: { user: { email: emailLower } }
      });
      results.deletedFrom.pendingShares = deletedPendingShares.count;

      // Delete threads created by this user
      const deletedThreads = await prisma.thread.deleteMany({
        where: { author: { email: emailLower } }
      });
      results.deletedFrom.threads = deletedThreads.count;

      // Delete from waitlist
      const deletedWaitlist = await prisma.waitlistEntry.deleteMany({
        where: { email: emailLower }
      });
      results.deletedFrom.waitlist = deletedWaitlist.count;

      // Finally, delete the user record
      const deletedUser = await prisma.user.deleteMany({
        where: { email: emailLower }
      });
      results.deletedFrom.user = deletedUser.count;

    } catch (dbError: any) {
      results.errors.push(`Database deletion error: ${dbError.message}`);
    }

    // 2. Delete from Supabase Auth (if service role key is available)
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const cookieStore = await cookies();
        const adminSupabase = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          {
            cookies: {
              get(name: string) { return cookieStore.get(name)?.value; },
              set(name: string, value: string, options: any) { cookieStore.set({ name, value, ...options }); },
              remove(name: string, options: any) { cookieStore.set({ name, value: '', ...options }); },
            },
          }
        );

        // Find users with this email in Supabase Auth
        const { data: userData, error: listError } = await adminSupabase.auth.admin.listUsers();
        
        if (listError) {
          results.errors.push(`Supabase list users error: ${listError.message}`);
        } else {
          const usersToDelete = userData.users.filter(u => u.email?.toLowerCase() === emailLower);
          results.deletedFrom.supabaseAuthFound = usersToDelete.length;

          // Delete each user from Supabase Auth
          for (const user of usersToDelete) {
            const { error: deleteError } = await adminSupabase.auth.admin.deleteUser(user.id);
            if (deleteError) {
              results.errors.push(`Failed to delete Supabase user ${user.id}: ${deleteError.message}`);
            }
          }
          
          if (usersToDelete.length > 0 && results.errors.length === 0) {
            results.deletedFrom.supabaseAuth = usersToDelete.length;
          }
        }
      } catch (authError: any) {
        results.errors.push(`Supabase Auth deletion error: ${authError.message}`);
      }
    } else {
      results.deletedFrom.supabaseAuth = 'Skipped - no service role key';
    }

    // 3. Summary
    const totalDeleted = Object.values(results.deletedFrom)
      .filter(v => typeof v === 'number')
      .reduce((sum: number, count: number) => sum + count, 0);

    return NextResponse.json({
      success: results.errors.length === 0,
      totalRecordsDeleted: totalDeleted,
      ...results,
      message: results.errors.length === 0 
        ? `Successfully cleaned up all traces of ${emailLower}`
        : `Cleanup completed with ${results.errors.length} errors`
    });

  } catch (error: any) {
    console.error('Cleanup user error:', error);
    return NextResponse.json(
      { error: 'Failed to cleanup user', details: error.message },
      { status: 500 }
    );
  }
}
