// app/api/health/route.ts
// Health check endpoint para Docker e monitoramento

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Verificações básicas de saúde da aplicação
    const healthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024),
      },
      services: {
        supabase: 'unknown', // Será verificado se necessário
        database: 'unknown'  // Será verificado se necessário
      }
    };

    // Verificação básica de conectividade com Supabase (opcional)
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      try {
        const supabaseCheck = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
          method: 'HEAD',
          headers: {
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
            'authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}`,
          },
        });
        
        healthCheck.services.supabase = supabaseCheck.ok ? 'healthy' : 'unhealthy';
      } catch (error) {
        healthCheck.services.supabase = 'error';
      }
    }

    // Status geral baseado nas verificações
    const isHealthy = Object.values(healthCheck.services).every(
      status => status === 'healthy' || status === 'unknown'
    );

    return NextResponse.json(healthCheck, {
      status: isHealthy ? 200 : 503,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });

  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  }
}

// Método HEAD para verificações mais leves
export async function HEAD(request: NextRequest) {
  try {
    // Verificação mínima para health checks frequentes
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    return new NextResponse(null, {
      status: 503,
    });
  }
}