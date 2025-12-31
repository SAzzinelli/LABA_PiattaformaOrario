import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    // Usa una tabella dedicata 'keepalive_log' che non contiene dati sensibili
    // RLS è abilitato con policy permissiva (vedi supabase/keepalive_log.sql)
    console.log('🔄 Chiamata REST Supabase su tabella keepalive_log...')
    
    const result = await supabase
      .from('keepalive_log')
      .select('id', { count: 'exact', head: true })
    
    console.log('📊 Risultato completo Supabase:', {
      hasError: !!result.error,
      count: result.count,
      error: result.error ? {
        message: result.error.message,
        code: result.error.code,
        details: result.error.details,
        hint: result.error.hint
      } : null
    })
    
    if (result.error) {
      console.warn('⚠️ Errore chiamata REST Supabase:', JSON.stringify(result.error, null, 2))
      return NextResponse.json(
        { 
          ok: false,
          status: 'error', 
          message: 'Database keepalive failed',
          error: result.error.message || 'Unknown error',
          code: result.error.code,
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ 
      ok: true,
      status: 'ok', 
      message: 'Database keepalive successful',
      timestamp: new Date().toISOString(),
      stats: {
        count: result.count || 0,
        rest_api: true
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
