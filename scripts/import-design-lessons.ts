/**
 * Script per importare lezioni di Design (1°, 2°, 3° anno - 1° e 2° semestre)
 * da JSON nella cartella DESIGN/
 */

// IMPORTANTE: Carica le variabili d'ambiente PRIMA di qualsiasi altro import
// Usa require per garantire l'esecuzione sincrona
const dotenv = require('dotenv')
const path = require('path')

// Carica .env.local se esiste
const envPath = path.join(process.cwd(), '.env.local')
const result = dotenv.config({ path: envPath })

if (result.error) {
  console.warn('⚠️  Impossibile caricare .env.local:', result.error.message)
}

// Verifica che le variabili siano caricate
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL non trovata nelle variabili d\'ambiente')
  process.exit(1)
}

// Inizializza Supabase direttamente qui invece di importarlo
const { createClient } = require('@supabase/supabase-js')
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Ora importa le altre dipendenze (ma non lib/db che usa lib/supabase)
import * as fs from 'fs'

// Definisce le interfacce e funzioni necessarie localmente
interface Lesson {
  id?: string
  title: string
  startTime: string
  endTime: string
  dayOfWeek: number
  classroom: string
  professor: string
  course?: string
  year?: number
  group?: string
  notes?: string
}

// Funzione per aggiungere una lezione direttamente usando Supabase
async function addLesson(lesson: Omit<Lesson, 'id'>): Promise<void> {
  const { error } = await supabase.from('lessons').insert({
    title: lesson.title,
    start_time: lesson.startTime,
    end_time: lesson.endTime,
    day_of_week: lesson.dayOfWeek,
    classroom: lesson.classroom,
    professor: lesson.professor,
    course: lesson.course || null,
    year: lesson.year || null,
    group_name: lesson.group || null,
    notes: lesson.notes || null,
  })

  if (error) {
    throw new Error(`Errore inserimento lezione: ${error.message}`)
  }
}

interface JsonLesson {
  corso: string
  oidCorso: string | null
  oidCorsi: string | null
  anno: number
  gruppo: string | null
  aula: string
  docente: string
  start: string // ISO date string
  end: string // ISO date string
  note: string | null
  corsoStudio: string
}

// Mappa per convertire i nomi delle aule dal JSON al formato del database
// Mantiene la distinzione tra aule unite e divise:
// - "Aula Magna" = aula unita
// - "Magna 1", "Magna 2" = aula divisa
// - "Conference" = aula unita
// - "Conference 1", "Conference 2" = aula divisa
const classroomMap: Record<string, string> = {
  'Aula Magna 2': 'Magna 2', // Aula divisa
  'Magna': 'Aula Magna', // Aula unita (quando è scritto solo "Magna")
  'Digital Hub': 'Digital HUB', // Correzione maiuscole
  // "Aula Magna" resta "Aula Magna" (aula unita)
  // "Conference 1", "Conference 2" restano così (aule divise)
}

// Funzione per normalizzare il nome dell'aula
function normalizeClassroom(aula: string): string {
  if (classroomMap[aula]) {
    return classroomMap[aula]
  }
  return aula
}

// Funzione per convertire una data ISO in giorno della settimana (0-6)
function getDayOfWeek(isoDateString: string): number {
  const date = new Date(isoDateString)
  return date.getDay() // 0 = Domenica, 1 = Lunedì, ..., 6 = Sabato
}

// Funzione per estrarre l'orario HH:mm da una stringa ISO
function extractTime(isoDateString: string): string {
  const date = new Date(isoDateString)
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}

// Funzione per convertire una lezione JSON nel formato del database
function convertLesson(jsonLesson: JsonLesson): Omit<Lesson, 'id'> | null {
  // Verifica che sia del corso Design
  if (jsonLesson.corsoStudio !== 'DESIGN') {
    return null
  }

  // Estrai il giorno della settimana
  const dayOfWeek = getDayOfWeek(jsonLesson.start)

  // Estrai gli orari
  const startTime = extractTime(jsonLesson.start)
  const endTime = extractTime(jsonLesson.end)

  // Normalizza l'aula
  const classroom = normalizeClassroom(jsonLesson.aula)

  // Il gruppo viene salvato così com'è (es. "A", "B")
  const group = jsonLesson.gruppo

  return {
    title: jsonLesson.corso,
    startTime,
    endTime,
    dayOfWeek,
    classroom,
    professor: jsonLesson.docente,
    course: 'Design', // Mappa corsoStudio "DESIGN" a "Design"
    year: jsonLesson.anno,
    group: group || undefined,
    notes: jsonLesson.note || undefined,
  }
}

// Funzione principale per importare le lezioni da un file JSON
async function importLessonsFromFile(
  filePath: string, 
  year: number, 
  semester: number
): Promise<{ imported: number; skipped: number; errors: number }> {
  console.log(`\n📂 Importando lezioni da: ${filePath}`)
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File non trovato: ${filePath}`)
    return { imported: 0, skipped: 0, errors: 1 }
  }

  const fileContent = fs.readFileSync(filePath, 'utf-8')
  const jsonLessons: JsonLesson[] = JSON.parse(fileContent)

  console.log(`   Trovate ${jsonLessons.length} lezioni nel file`)

  let importedCount = 0
  let skippedCount = 0
  let errorCount = 0

  for (const jsonLesson of jsonLessons) {
    try {
      // Verifica che l'anno corrisponda
      if (jsonLesson.anno !== year) {
        skippedCount++
        continue
      }

      // Converti la lezione
      const lesson = convertLesson(jsonLesson)
      if (!lesson) {
        skippedCount++
        continue
      }

      // Importa nel database
      await addLesson(lesson)
      importedCount++
      
      if (importedCount % 50 === 0) {
        console.log(`   ✅ Importate ${importedCount} lezioni...`)
      }
    } catch (error: any) {
      errorCount++
      console.error(`   ❌ Errore importando "${jsonLesson.corso}" (${jsonLesson.start}):`, error.message)
    }
  }

  console.log(`   ✅ Completato per anno ${year}, semestre ${semester}:`)
  console.log(`      - Importate: ${importedCount}`)
  console.log(`      - Saltate: ${skippedCount}`)
  console.log(`      - Errori: ${errorCount}`)

  return { imported: importedCount, skipped: skippedCount, errors: errorCount }
}

// Funzione principale
async function main() {
  console.log('🚀 Avvio importazione lezioni Design (1° e 2° semestre)\n')

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

  for (const { path: filePath, year, semester } of filesToImport) {
    const result = await importLessonsFromFile(filePath, year, semester)
    totalImported += result.imported
    totalSkipped += result.skipped
    totalErrors += result.errors
  }

  console.log('\n✨ Importazione completata!')
  console.log(`📊 Statistiche totali:`)
  console.log(`   - Importate: ${totalImported}`)
  console.log(`   - Saltate: ${totalSkipped}`)
  console.log(`   - Errori: ${totalErrors}`)
}

// Esegui se chiamato direttamente
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Errore durante l\'importazione:', error)
    process.exit(1)
  })
}

export { importLessonsFromFile, convertLesson }

