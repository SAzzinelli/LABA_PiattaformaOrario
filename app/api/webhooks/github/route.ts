/**
 * POST /api/webhooks/github
 *
 * Webhook ricevuto da GitHub quando c'è un push su LABA_Orari.
 * Esegue automaticamente il sync degli orari nella piattaforma.
 *
 * Configura in GitHub: LABA_Orari → Settings → Webhooks → Add webhook
 * - Payload URL: https://orario.laba.biz/api/webhooks/github
 * - Content type: application/json
 * - Secret: (imposta GITHUB_WEBHOOK_SECRET in Railway)
 * - Events: Just the push event
 */

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { syncFromGitHub } from '@/lib/syncFromGitHub'
import { supabaseAdmin, supabase } from '@/lib/supabase'

const LABA_ORARI_REPO = 'LABA_Orari'

function verifySignature(payload: string, signature: string | null, secret: string): boolean {
  if (!signature || !secret) return false
  const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(payload).digest('hex')
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  const secret = process.env.GITHUB_WEBHOOK_SECRET

  // Richiedi il secret in produzione per sicurezza
  if (!secret) {
    console.warn('GITHUB_WEBHOOK_SECRET non configurato - webhook disabilitato')
    return NextResponse.json({ error: 'Webhook non configurato' }, { status: 503 })
  }

  const signature = request.headers.get('x-hub-signature-256')
  const event = request.headers.get('x-github-event')
  const rawBody = await request.text()

  if (!verifySignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  // Ping: GitHub invia quando crei il webhook per verificare che funzioni
  if (event === 'ping') {
    return NextResponse.json({ message: 'pong' }, { status: 200 })
  }

  if (event !== 'push') {
    return NextResponse.json({ message: 'Ignored' }, { status: 200 })
  }

  let payload: { repository?: { full_name?: string }; ref?: string }
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const repoName = payload.repository?.full_name
  const ref = payload.ref || ''

  // Solo push su main/master del repo LABA_Orari (LABA-Firenze/LABA_Orari)
  const isLabOrari =
    repoName?.endsWith(`/${LABA_ORARI_REPO}`) || repoName === LABA_ORARI_REPO
  const isMainBranch = ref.endsWith('/main') || ref.endsWith('/master')

  if (!isLabOrari || !isMainBranch) {
    return NextResponse.json({ message: 'Ignored - not LABA_Orari main' }, { status: 200 })
  }

  // Esegui sync in background - rispondi subito a GitHub (deve ricevere 200 entro ~10s)
  const client = supabaseAdmin ?? supabase
  syncFromGitHub(client)
    .then((results) => {
      const total = results.reduce(
        (acc, r) => ({ imported: acc.imported + r.imported, errors: acc.errors + r.errors }),
        { imported: 0, errors: 0 }
      )
      console.log('[Webhook GitHub] Sync completato:', total)
    })
    .catch((err) => {
      console.error('[Webhook GitHub] Sync fallito:', err)
    })

  return NextResponse.json({ message: 'Sync avviato' }, { status: 200 })
}
