import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Test basic environment variables
    const envCheck = {
      DATABASE_URL: !!process.env.DATABASE_URL,
      SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      DATABASE_CONNECTION_LIMIT: process.env.DATABASE_CONNECTION_LIMIT || 'not set',
      DATABASE_POOL_TIMEOUT: process.env.DATABASE_POOL_TIMEOUT || 'not set',
      DATABASE_CONNECT_TIMEOUT: process.env.DATABASE_CONNECT_TIMEOUT || 'not set',
    }

    // Test database connection
