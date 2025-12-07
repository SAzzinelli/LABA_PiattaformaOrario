// Genera slot orari da mezz'ora dalle 8:00 alle 22:00
export function generateTimeSlots(): string[] {
  const slots: string[] = []
  for (let hour = 8; hour < 22; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`)
    slots.push(`${hour.toString().padStart(2, '0')}:30`)
  }
  return slots
}

// Converte orario HH:mm o HH:mm:ss in minuti dall'inizio del giorno
export function timeToMinutes(time: string): number {
  // Rimuovi i secondi se presenti (formato HH:mm:ss -> HH:mm)
  const timeWithoutSeconds = time.split(':').slice(0, 2).join(':')
  const [hours, minutes] = timeWithoutSeconds.split(':').map(Number)
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

// Calcola la posizione verticale di un orario nella griglia
export function getTimePosition(time: string): number {
  const minutes = timeToMinutes(time)
  const startMinutes = 8 * 60 // 8:00
  // Arrotonda per eccesso per allineare correttamente con gli slot
  return Math.floor((minutes - startMinutes) / 30) // Posizione in slot (ogni slot = 30 min)
}

// Ottiene l'orario corrente in formato HH:mm
export function getCurrentTime(): string {
  const now = new Date()
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
}

// Verifica se un orario è nel range 8:00-22:00
export function isTimeInRange(time: string): boolean {
  const minutes = timeToMinutes(time)
  return minutes >= 8 * 60 && minutes < 22 * 60
}

// Interfaccia per le linee temporali
export interface TimeLine {
  time: string
  position: number // Posizione in pixel (basata su 60px per slot)
  isHour: boolean // true se è un'ora intera (es. 9:00), false se è mezz'ora (es. 9:30)
}

// Genera le linee temporali per il calendario
export function generateTimeLines(rowHeight: number = 60): TimeLine[] {
  const lines: TimeLine[] = []
  const slots = generateTimeSlots()
  
  slots.forEach((time, index) => {
    const isHour = time.endsWith(':00')
    lines.push({
      time,
      position: index * rowHeight,
      isHour,
    })
  })
  
  return lines
}

// Calcola l'altezza totale del calendario in pixel
export function getTotalCalendarHeight(rowHeight: number = 60): number {
  const slots = generateTimeSlots()
  return slots.length * rowHeight
}

