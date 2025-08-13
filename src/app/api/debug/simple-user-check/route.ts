import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Check if user exists in our database
    const dbUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        inviteCode: true,
        invitedById: true,
      }
    });

    // Also check if there was a waitlist entry
    const waitlistEntry = await prisma.waitlistEntry.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: {
        id: true,
        email: true,
        createdAt: true,
        notified: true,
        message: true,
      }
    });

    return NextResponse.json({
      email: email.toLowerCase().trim(),
      database: {
        userExists: !!dbUser,
        user: dbUser,
        waitlistEntry: waitlistEntry,
      },
      timestamp: new Date().toISOString(),
      note: dbUser ? 
        "User exists in database - account was created successfully" :
        "User not found in database - signup may have failed"
    });

  } catch (error: any) {
    console.error('Simple user check error:', error);
    return NextResponse.json(
      { error: 'Failed to check user', details: error.message },
      { status: 500 }
    );
  }
}
