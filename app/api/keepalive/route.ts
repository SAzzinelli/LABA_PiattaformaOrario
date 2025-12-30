import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    // Query significative su tabelle reali per garantire che Supabase rilevi attività
    // Eseguiamo COUNT su più tabelle per massimizzare l'attività rilevata
    const [lessonsResult, adminUsersResult] = await Promise.all([
      supabase.from('lessons').select('id', { count: 'exact', head: true }),
      supabase.from('admin_users').select('id', { count: 'exact', head: true })
    ])
    
    return NextResponse.json({ 
      ok: true,
      status: 'ok', 
      message: 'Database keepalive successful',
      timestamp: new Date().toISOString(),
      stats: {
        lessons: lessonsResult.count || 0,
        admin_users: adminUsersResult.count || 0
      }
    })
  } catch (error) {
    console.error('❌ Errore keepalive database:', error)
    return NextResponse.json(
      { 
        ok: false,
        status: 'error', 
        message: 'Database keepalive failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
