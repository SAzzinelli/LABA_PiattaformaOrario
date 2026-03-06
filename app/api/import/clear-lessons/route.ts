import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { supabaseAdmin, supabase } from '@/lib/supabase'

/**
 * POST /api/import/clear-lessons
 * Elimina tutte le lezioni dal database (senza sync da GitHub).
 * Richiede autenticazione admin.
 */
export async function POST(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value
  if (!token) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  }

  const payload = await verifyToken(token)
  if (!payload) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  }

  try {
    const client = supabaseAdmin ?? supabase
    const { error } = await client
      .from('lessons')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (error) {
      console.error('Clear lessons error:', error)
      return NextResponse.json(
        { error: `Errore durante l'eliminazione: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Tutti gli orari sono stati eliminati.' })
  } catch (error: any) {
    console.error('Clear lessons error:', error)
    return NextResponse.json(
      { error: error.message || "Errore durante l'eliminazione" },
      { status: 500 }
    )
  }
}
