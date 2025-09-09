import { NextResponse } from 'next/server'
import { config } from '@/config/appConfig'

export async function GET() {
  try {
    // Basic health check - you can add more sophisticated checks here
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      api: {
        baseUrl: config.api.baseUrl || process.env.NEXT_PUBLIC_API_BASE || 'not configured'
      },
      debug: {
        processEnvApiBase: process.env.NEXT_PUBLIC_API_BASE || 'undefined',
        configApiBase: config.api.baseUrl || 'undefined'
      }
    }

    return NextResponse.json(healthData, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'unhealthy', 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    )
  }
}