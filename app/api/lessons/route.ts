import { NextRequest, NextResponse } from 'next/server'
import { getLessons, addLesson } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function GET() {
  const lessons = getLessons()
  return NextResponse.json(lessons)
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
    const lesson = addLesson(data)
    return NextResponse.json(lesson, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Errore durante la creazione della lezione' },
      { status: 500 }
    )
  }
}

