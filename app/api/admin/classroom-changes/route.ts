import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyToken } from '@/lib/auth'

// GET - Lista cambi aula
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

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    
    let query = supabase
      .from('classroom_changes')
      .select('*, lessons(*)')
      .order('change_date', { ascending: false })
      .order('start_time', { ascending: true })

    if (date) {
      query = query.eq('change_date', date)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching classroom changes:', error)
      return NextResponse.json({ error: 'Errore nel recupero dei cambi aula' }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Error in GET classroom changes:', error)
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 })
  }
}

// POST - Crea cambio aula
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
    const { lesson_id, original_classroom, new_classroom, change_date, start_time, end_time, reason, is_temporary } = body

    if (!original_classroom || !new_classroom || !change_date || !start_time || !end_time) {
      return NextResponse.json({ error: 'Campi obbligatori mancanti' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('classroom_changes')
      .insert({
        lesson_id: lesson_id || null,
        original_classroom,
        new_classroom,
        change_date,
        start_time,
        end_time,
        reason: reason || null,
        is_temporary: is_temporary !== undefined ? is_temporary : true
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating classroom change:', error)
      return NextResponse.json({ error: 'Errore nella creazione del cambio aula' }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error in POST classroom changes:', error)
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 })
  }
}

// DELETE - Elimina cambio aula
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
      return NextResponse.json({ error: 'ID cambio aula richiesto' }, { status: 400 })
    }

    const { error } = await supabase
      .from('classroom_changes')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting classroom change:', error)
      return NextResponse.json({ error: 'Errore nell\'eliminazione del cambio aula' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE classroom changes:', error)
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 })
  }
}

