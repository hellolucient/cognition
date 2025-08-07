import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

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
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
      log: ['error'],
    })

    try {
      // Simple database test
      await prisma.$queryRaw`SELECT 1 as test`
      
      return NextResponse.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: envCheck,
        database: 'connected',
        message: 'All systems operational'
      })
    } catch (dbError: any) {
      return NextResponse.json({
        status: 'database_error',
        timestamp: new Date().toISOString(),
        environment: envCheck,
        database: 'failed',
        error: dbError.message,
        message: 'Database connection failed'
      }, { status: 500 })
    } finally {
      await prisma.$disconnect()
    }

  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message,
      message: 'System check failed'
    }, { status: 500 })
  }
}
