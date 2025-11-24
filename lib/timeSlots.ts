// Genera slot orari da mezz'ora dalle 8:00 alle 21:00
export function generateTimeSlots(): string[] {
  const slots: string[] = []
  for (let hour = 8; hour < 21; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`)
    slots.push(`${hour.toString().padStart(2, '0')}:30`)
  }
  return slots
}

// Genera tutti gli orari (ore e mezze ore) per le linee
export function generateTimeLines(): Array<{ time: string; isHour: boolean; position: number }> {
  const lines: Array<{ time: string; isHour: boolean; position: number }> = []
  for (let hour = 8; hour <= 21; hour++) {
    // Linea per l'ora intera
    lines.push({
      time: `${hour.toString().padStart(2, '0')}:00`,
      isHour: true,
      position: (hour - 8) * 60 * 2, // Ogni ora = 120px
    })
    // Linea per la mezz'ora (solo se non è l'ultima ora)
    if (hour < 21) {
      lines.push({
        time: `${hour.toString().padStart(2, '0')}:30`,
        isHour: false,
        position: ((hour - 8) * 60 + 30) * 2, // Mezz'ora dopo l'ora
      })
    }
  }
  return lines
}

// Converte orario HH:mm in minuti dall'inizio del giorno
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

// Converte minuti in orario HH:mm
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

// Calcola quanti slot occupa una lezione
export function getLessonSlots(startTime: string, endTime: string): number {
  const start = timeToMinutes(startTime)
  const end = timeToMinutes(endTime)
  const duration = end - start
  return Math.ceil(duration / 30) // Ogni slot è 30 minuti
}

// Calcola la posizione verticale in pixel di un orario nella griglia
// Ogni ora = 120px, ogni minuto = 2px
export function getTimePosition(time: string): number {
  const minutes = timeToMinutes(time)
  const startMinutes = 8 * 60 // 8:00
  return (minutes - startMinutes) * 2 // Posizione in pixel (2px per minuto)
}

// Altezza totale del calendario in pixel (8:00 - 21:00 = 13 ore = 1560px)
export function getTotalCalendarHeight(): number {
  return 13 * 60 * 2 // 13 ore * 60 minuti * 2px = 1560px
}

// Ottiene l'orario corrente in formato HH:mm
export function getCurrentTime(): string {
  const now = new Date()
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
}

// Verifica se un orario è nel range 8:00-21:00
export function isTimeInRange(time: string): boolean {
  const minutes = timeToMinutes(time)
  return minutes >= 8 * 60 && minutes < 21 * 60
}

