import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyToken } from '@/lib/auth'

// GET - Lista assenze
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value
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
      .from('professor_absences')
      .select('*, lessons(*)')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })

    if (date) {
      query = query.eq('date', date)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching absences:', error)
      return NextResponse.json({ error: 'Errore nel recupero delle assenze' }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Error in GET absences:', error)
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 })
  }
}

// POST - Crea assenza
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }
    const verified = await verifyToken(token)
    if (!verified) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const body = await request.json()
    const { professor, lesson_id, date, reason, is_notified } = body

    if (!professor || !date) {
      return NextResponse.json({ error: 'Professore e data sono obbligatori' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('professor_absences')
      .insert({
        professor,
        lesson_id: lesson_id || null,
        date,
        reason: reason || null,
        is_notified: is_notified || false
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating absence:', error)
      return NextResponse.json({ error: 'Errore nella creazione dell\'assenza' }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error in POST absences:', error)
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 })
  }
}

// DELETE - Elimina assenza
export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value
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
      return NextResponse.json({ error: 'ID assenza richiesto' }, { status: 400 })
    }

    const { error } = await supabase
      .from('professor_absences')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting absence:', error)
      return NextResponse.json({ error: 'Errore nell\'eliminazione dell\'assenza' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE absences:', error)
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 })
  }
}

