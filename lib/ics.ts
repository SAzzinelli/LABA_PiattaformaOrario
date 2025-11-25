import { Lesson } from '@/hooks/useLessons'
import { addWeeks, format, setDay, setHours, setMinutes } from 'date-fns'

export function generateICS(lessons: Lesson[]): string {
    let icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//LABA//Piattaforma Orario//IT',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'X-WR-CALNAME:Orario LABA',
        'X-WR-TIMEZONE:Europe/Rome',
    ]

    // Genera eventi per le prossime 16 settimane (semestre)
    // Poiché le lezioni sono ricorrenti settimanalmente nel DB ma qui le abbiamo come oggetti "giorno della settimana"
    // Dobbiamo generare le occorrenze reali.
    // Assumiamo che l'orario sia valido da oggi per 4 mesi.

    const today = new Date()
    const startDate = today
    const endDate = addWeeks(today, 16)

    lessons.forEach((lesson) => {
        // Calcola la prima occorrenza di questa lezione a partire da oggi
        let current = setDay(startDate, lesson.dayOfWeek, { weekStartsOn: 0 }) // 0 = Sunday
        if (current < startDate) {
            current = addWeeks(current, 1)
        }

        // Imposta orario inizio e fine
        const [startHour, startMinute] = lesson.startTime.split(':').map(Number)
        const [endHour, endMinute] = lesson.endTime.split(':').map(Number)

        // Genera evento ricorrente
        // RRULE:FREQ=WEEKLY;UNTIL=...

        const dtStart = formatICSDate(setMinutes(setHours(current, startHour), startMinute))
        const dtEnd = formatICSDate(setMinutes(setHours(current, endHour), endMinute))
        const until = formatICSDate(endDate)

        icsContent.push(
            'BEGIN:VEVENT',
            `UID:${lesson.id}-${dtStart}@laba.edu`,
            `DTSTAMP:${formatICSDate(new Date())}`,
            `DTSTART:${dtStart}`,
            `DTEND:${dtEnd}`,
            `RRULE:FREQ=WEEKLY;UNTIL=${until}`,
            `SUMMARY:${lesson.title}`,
            `DESCRIPTION:${lesson.professor} - ${lesson.course || ''} ${lesson.group ? `(${lesson.group})` : ''}`,
            `LOCATION:${lesson.classroom}`,
            'END:VEVENT'
        )
    })

    icsContent.push('END:VCALENDAR')
    return icsContent.join('\r\n')
}

function formatICSDate(date: Date): string {
    return format(date, "yyyyMMdd'T'HHmmss")
}
