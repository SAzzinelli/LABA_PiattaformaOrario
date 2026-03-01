/**
 * POST /api/export/push-github
 *
 * Esporta le lezioni da Supabase verso LABA_Orari su GitHub.
 * Richiede autenticazione admin e GITHUB_TOKEN configurato.
 */

import { NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { supabaseAdmin, supabase } from '@/lib/supabase'
import { exportToGitHub } from '@/lib/exportToGitHub'

export async function POST(request: Request) {
  const token = request.cookies.get('auth-token')?.value
  if (!token) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  }

  const payload = await verifyToken(token)
  if (!payload) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  }

  const githubToken = process.env.GITHUB_TOKEN
  if (!githubToken) {
    return NextResponse.json(
      { error: 'GITHUB_TOKEN non configurato. Aggiungi un Personal Access Token in Railway.' },
      { status: 503 }
    )
  }

  try {
    const client = supabaseAdmin ?? supabase
    const { data: lessons, error } = await client
      .from('lessons')
      .select('title, start_time, end_time, day_of_week, classroom, professor, course, year, group_name, notes')
      .not('course', 'is', null)
      .not('year', 'is', null)

    if (error) {
      console.error('Export: fetch lessons error', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!lessons || lessons.length === 0) {
      return NextResponse.json({
        message: 'Nessuna lezione da esportare',
        results: [],
      })
    }

    const results = await exportToGitHub(lessons, { token: githubToken })

    const totalOk = results.filter((r) => r.ok).length
    const totalEntries = results.reduce((s, r) => s + r.entries, 0)

    return NextResponse.json({
      message: totalOk === results.length
        ? `Esportate ${totalEntries} occorrenze su ${results.length} file`
        : `Completato con errori: ${results.filter((r) => !r.ok).length} file falliti`,
      totalEntries,
      results,
    })
  } catch (err: any) {
    console.error('Export to GitHub error:', err)
    return NextResponse.json(
      { error: err.message || 'Errore durante l\'esportazione' },
      { status: 500 }
    )
  }
}
