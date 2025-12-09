import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const today = new Date().toISOString().split('T')[0]
    const startOfWeek = new Date()
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1) // Lunedì
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(endOfWeek.getDate() + 6) // Domenica

    // Inizializza con valori di default
    let absencesToday: any[] = []
    let absencesWeek: any[] = []
    let makeupLessons: any[] = []
    let classroomChanges: any[] = []

    // 1. Assenze professori (oggi e questa settimana)
    // Gestisci il caso in cui la tabella non esiste ancora
    try {
      const { data: absToday, error: absTodayError } = await supabase
        .from('professor_absences')
        .select('*, lessons(*)')
        .eq('date', today)

      if (!absTodayError) {
        absencesToday = absToday || []
      }

      const { data: absWeek, error: absWeekError } = await supabase
        .from('professor_absences')
        .select('*, lessons(*)')
        .gte('date', startOfWeek.toISOString().split('T')[0])
        .lte('date', endOfWeek.toISOString().split('T')[0])

      if (!absWeekError) {
        absencesWeek = absWeek || []
      }
    } catch (e) {
      console.log('Tabelle assenze non ancora create:', e)
    }

    // 2. Recuperi programmati (prossimi 7 giorni)
    try {
      const nextWeek = new Date()
      nextWeek.setDate(nextWeek.getDate() + 7)
      
      const { data: makeup, error: makeupError } = await supabase
        .from('makeup_lessons')
        .select('*')
        .gte('scheduled_date', today)
        .lte('scheduled_date', nextWeek.toISOString().split('T')[0])
        .order('scheduled_date', { ascending: true })
        .order('start_time', { ascending: true })

      if (!makeupError) {
        makeupLessons = makeup || []
      }
    } catch (e) {
      console.log('Tabelle recuperi non ancora create:', e)
    }

    // 3. Cambi aula attivi (oggi)
    try {
      const { data: changes, error: changesError } = await supabase
        .from('classroom_changes')
        .select('*, lessons(*)')
        .eq('change_date', today)
        .eq('is_temporary', true)

      if (!changesError) {
        classroomChanges = changes || []
      }
    } catch (e) {
      console.log('Tabelle cambi aula non ancora create:', e)
    }

    return NextResponse.json({
      absences: {
        today: absencesToday,
        thisWeek: absencesWeek,
        todayCount: absencesToday.length,
        weekCount: absencesWeek.length
      },
      makeupLessons: makeupLessons,
      makeupCount: makeupLessons.length,
      classroomChanges: classroomChanges,
      changesCount: classroomChanges.length
    })
  } catch (error) {
    console.error('Error in KPI API:', error)
    // Ritorna valori vuoti invece di errore se le tabelle non esistono
    return NextResponse.json({
      absences: {
        today: [],
        thisWeek: [],
        todayCount: 0,
        weekCount: 0
      },
      makeupLessons: [],
      makeupCount: 0,
      classroomChanges: [],
      changesCount: 0
    })
  }
}

