import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { importLessonsFromFile } from '@/scripts/import-design-lessons'
import * as path from 'path'

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
    const baseDir = path.join(process.cwd(), 'DESIGN')
    
    // File da importare: tutti gli anni (1, 2, 3) e tutti i semestri (1, 2)
    const filesToImport = [
      { path: path.join(baseDir, '1', '1sem.json'), year: 1, semester: 1 },
      { path: path.join(baseDir, '1', '2sem.json'), year: 1, semester: 2 },
      { path: path.join(baseDir, '2', '1sem.json'), year: 2, semester: 1 },
      { path: path.join(baseDir, '2', '2sem.json'), year: 2, semester: 2 },
      { path: path.join(baseDir, '3', '1sem.json'), year: 3, semester: 1 },
      { path: path.join(baseDir, '3', '2sem.json'), year: 3, semester: 2 },
    ]

    let totalImported = 0
    let totalSkipped = 0
    let totalErrors = 0
    const results: Array<{ file: string; imported: number; skipped: number; errors: number }> = []

    for (const { path: filePath, year, semester } of filesToImport) {
      try {
        const result = await importLessonsFromFile(filePath, year, semester)
        totalImported += result.imported
        totalSkipped += result.skipped
        totalErrors += result.errors
        results.push({ 
          file: `${year}° anno - ${semester}° semestre`, 
          imported: result.imported,
          skipped: result.skipped,
          errors: result.errors
        })
      } catch (error: any) {
        console.error(`Error importing ${filePath}:`, error)
        totalErrors++
        results.push({ 
          file: `${year}° anno - ${semester}° semestre`, 
          imported: 0,
          skipped: 0,
          errors: 1 
        })
      }
    }

    return NextResponse.json(
      { 
        message: 'Importazione completata', 
        total: {
          imported: totalImported,
          skipped: totalSkipped,
          errors: totalErrors
        },
        results 
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error during design lessons import:', error)
    return NextResponse.json(
      { error: error.message || 'Errore durante l\'importazione delle lezioni di Design' },
      { status: 500 }
    )
  }
}

