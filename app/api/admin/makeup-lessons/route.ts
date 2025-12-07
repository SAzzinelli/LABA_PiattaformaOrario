import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyToken } from '@/lib/auth'

// GET - Lista recuperi
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }
    const verified = await verifyToken(token)
    if (!verified) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('makeup_lessons')
      .select('*')
      .order('scheduled_date', { ascending: true })
      .order('start_time', { ascending: true })

    if (error) {
      console.error('Error fetching makeup lessons:', error)
      return NextResponse.json({ error: 'Errore nel recupero dei recuperi' }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Error in GET makeup lessons:', error)
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 })
  }
}

// POST - Crea recupero
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }
    const verified = await verifyToken(token)
    if (!verified) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      original_lesson_id, 
      title, 
      professor, 
      classroom, 
      scheduled_date, 
      start_time, 
      end_time, 
      group_name, 
      course, 
      year, 
      notes 
    } = body

    if (!title || !professor || !classroom || !scheduled_date || !start_time || !end_time) {
      return NextResponse.json({ error: 'Campi obbligatori mancanti' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('makeup_lessons')
      .insert({
        original_lesson_id: original_lesson_id || null,
        title,
        professor,
        classroom,
        scheduled_date,
        start_time,
        end_time,
        group_name: group_name || null,
        course: course || null,
        year: year || null,
        notes: notes || null
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating makeup lesson:', error)
      // Se la tabella non esiste ancora, ritorna errore informativo
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return NextResponse.json({ 
          error: 'La tabella makeup_lessons non esiste ancora. Esegui lo script SQL schema_dashboard.sql in Supabase.' 
        }, { status: 500 })
      }
      return NextResponse.json({ error: 'Errore nella creazione del recupero' }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error in POST makeup lessons:', error)
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 })
  }
}

// DELETE - Elimina recupero
export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }
    const verified = await verifyToken(token)
    if (!verified) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID recupero richiesto' }, { status: 400 })
    }

    const { error } = await supabase
      .from('makeup_lessons')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting makeup lesson:', error)
      return NextResponse.json({ error: 'Errore nell\'eliminazione del recupero' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE makeup lessons:', error)
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 })
  }
}

