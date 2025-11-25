import { NextRequest, NextResponse } from 'next/server'
import { updateLesson, deleteLesson, updateLessonAndFuture } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Check authentication
  const token = request.cookies.get('auth-token')?.value
  if (!token) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  }

  const payload = await verifyToken(token)
  if (!payload) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  }

  try {
    const { id } = await params
    const data = await request.json()
    const { updateScope, ...lessonData } = data
    
    // Se updateScope è 'future', aggiorna tutte le lezioni future con le stesse caratteristiche
    if (updateScope === 'future') {
      const result = await updateLessonAndFuture(id, lessonData)
      if (!result) {
        return NextResponse.json({ error: 'Lezione non trovata' }, { status: 404 })
      }
      return NextResponse.json({ updated: result.count, lessons: result.lessons })
    } else {
      // Aggiorna solo la lezione corrente
      const lesson = await updateLesson(id, lessonData)
      if (!lesson) {
        return NextResponse.json({ error: 'Lezione non trovata' }, { status: 404 })
      }
      return NextResponse.json(lesson)
    }
  } catch (error) {
    console.error('Error updating lesson:', error)
    return NextResponse.json(
      { error: 'Errore durante l\'aggiornamento della lezione' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Check authentication
  const token = request.cookies.get('auth-token')?.value
  if (!token) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  }

  const payload = await verifyToken(token)
  if (!payload) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  }

  try {
    const { id } = await params
    const success = await deleteLesson(id)
    if (!success) {
      return NextResponse.json({ error: 'Lezione non trovata' }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting lesson:', error)
    return NextResponse.json(
      { error: 'Errore durante l\'eliminazione della lezione' },
      { status: 500 }
    )
  }
}

