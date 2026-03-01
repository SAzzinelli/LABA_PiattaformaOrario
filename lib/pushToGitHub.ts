/**
 * Trigger push delle lezioni su GitHub in background.
 * Usato dopo create/update/delete di lezioni per mantenere LABA_Orari in sync.
 */

import { supabaseAdmin, supabase } from './supabase'
import { exportToGitHub } from './exportToGitHub'

/** Esegue il push su GitHub senza bloccare. Non lanciare eccezioni. */
export function triggerPushToGitHub(): void {
  const token = process.env.GITHUB_TOKEN
  if (!token) {
    return
  }
  const client = supabaseAdmin ?? supabase
  client
    .from('lessons')
    .select('title, start_time, end_time, day_of_week, classroom, professor, course, year, group_name, notes')
    .not('course', 'is', null)
    .not('year', 'is', null)
    .then(({ data: lessons, error }) => {
      if (error || !lessons?.length) return
      return exportToGitHub(lessons, { token })
    })
    .then((results) => {
      if (results) {
        const ok = results.filter((r) => r.ok).length
        console.log(`[Push GitHub] Completato: ${ok}/${results.length} file`)
      }
    })
    .catch((err) => {
      console.error('[Push GitHub] Errore:', err?.message ?? err)
    })
}
