import { NextRequest, NextResponse } from 'next/server'
import { getDistinctProfessors, getDistinctClassrooms } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const [professors, classroomsFromDb] = await Promise.all([
      getDistinctProfessors(),
      getDistinctClassrooms(),
    ])
    return NextResponse.json({ professors, classrooms: classroomsFromDb })
  } catch (error) {
    console.error('Error fetching lesson options:', error)
    return NextResponse.json({ professors: [], classrooms: [] })
  }
}
