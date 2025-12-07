import { NextRequest, NextResponse } from 'next/server'
import { getLessons, addLesson, LessonFilters } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const filters: LessonFilters = {}
    
    if (searchParams.get('course')) {
      filters.course = searchParams.get('course') || undefined
    }
    if (searchParams.get('year')) {
      filters.year = parseInt(searchParams.get('year') || '0')
    }
    
    const lessons = await getLessons(Object.keys(filters).length > 0 ? filters : undefined)
    return NextResponse.json(lessons || [])
  } catch (error) {
    console.error('Error fetching lessons:', error)
    // Restituisci array vuoto invece di errore 500 per permettere al calendario di funzionare
    return NextResponse.json([])
  }
}

export async function POST(request: NextRequest) {
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
    const data = await request.json()
    const lesson = await addLesson(data)
    return NextResponse.json(lesson, { status: 201 })
  } catch (error) {
    console.error('Error creating lesson:', error)
    return NextResponse.json(
      { error: 'Errore durante la creazione della lezione' },
      { status: 500 }
    )
  }
}

