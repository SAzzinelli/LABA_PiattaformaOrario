import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { syncFromGitHub } from '@/lib/syncFromGitHub'
import { supabaseAdmin, supabase } from '@/lib/supabase'

/**
 * POST /api/import/sync-github
 * Sincronizza gli orari da LABA_Orari (GitHub Pages) nel database.
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
    const body = await request.json().catch(() => ({}))
    const clearFirst = body?.clearFirst === true

    if (clearFirst) {
      const { error: delErr } = await client
        .from('lessons')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000')
      if (delErr) {
        console.error('Clear lessons error:', delErr)
        return NextResponse.json(
          { error: `Errore durante lo svuotamento: ${delErr.message}` },
          { status: 500 }
        )
      }
    }

    const results = await syncFromGitHub(client)

    const total = results.reduce(
      (acc, r) => ({ imported: acc.imported + r.imported, errors: acc.errors + r.errors }),
      { imported: 0, errors: 0 }
    )

    return NextResponse.json({
      message: 'Sync completato',
      total,
      results,
    })
  } catch (error: any) {
    console.error('Sync GitHub error:', error)
    return NextResponse.json(
      { error: error.message || 'Errore durante la sincronizzazione' },
      { status: 500 }
    )
  }
}
