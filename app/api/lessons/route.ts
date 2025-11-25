import { NextRequest, NextResponse } from 'next/server'
import { getLessons, addLesson, LessonFilters } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const filters: LessonFilters = {}

    // Supporta filtri multipli per corsi e anni
    const courses = searchParams.getAll('course')
    const years = searchParams.getAll('year').map(y => parseInt(y)).filter(y => !isNaN(y))

    if (courses.length > 0) {
      filters.courses = courses
    }
    if (years.length > 0) {
      filters.years = years
    }

    const lessons = await getLessons(Object.keys(filters).length > 0 ? filters : undefined)
    return NextResponse.json(lessons)
  } catch (error) {
    console.error('Error fetching lessons:', error)
    return NextResponse.json(
      { error: 'Errore durante il recupero delle lezioni' },
      { status: 500 }
    )
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
    // console.log('Received lesson data:', JSON.stringify(data, null, 2))
    const lesson = await addLesson(data)
    return NextResponse.json(lesson, { status: 201 })
  } catch (error: any) {
    console.error('Error creating lesson:', error)
    console.error('Error stack:', error?.stack)
    const errorMessage = error?.message || 'Errore durante la creazione della lezione'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

