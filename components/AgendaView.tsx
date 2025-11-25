import { Lesson } from '@/hooks/useLessons'
import { getCourseColor } from '@/lib/courseColors'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'

interface AgendaViewProps {
    lessons: Lesson[]
    currentDate: Date
    isAuthenticated: boolean
    onEditLesson: (lesson: Lesson) => void
    onViewLesson: (lesson: Lesson) => void
}

export default function AgendaView({
    lessons,
    currentDate,
    isAuthenticated,
    onEditLesson,
    onViewLesson
}: AgendaViewProps) {
    // Filtra lezioni per il giorno corrente
    const dayLessons = lessons
        .filter(lesson => lesson.dayOfWeek === currentDate.getDay())
        .sort((a, b) => a.startTime.localeCompare(b.startTime))

    if (dayLessons.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-lg font-medium">Nessuna lezione in programma</p>
                <p className="text-sm">Seleziona un'altra data o aggiungi una lezione.</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-3 p-4 pb-20 overflow-y-auto">
            {dayLessons.map((lesson) => {
                const courseColor = getCourseColor(lesson.course)

                return (
                    <div
                        key={lesson.id}
                        onClick={() => isAuthenticated ? onEditLesson(lesson) : onViewLesson(lesson)}
                        className={`
              relative flex flex-col p-4 rounded-xl border-l-4 shadow-sm bg-white
              ${courseColor.border} hover:shadow-md transition-all active:scale-[0.98]
            `}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex flex-col">
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full w-fit mb-1 ${courseColor.bg} ${courseColor.text} bg-opacity-20`}>
                                    {lesson.startTime.substring(0, 5)} - {lesson.endTime.substring(0, 5)}
                                </span>
                                <h3 className="font-bold text-gray-900 text-lg leading-tight">
                                    {lesson.title}
                                </h3>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                                    {lesson.classroom}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-1 mt-1">
                            <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <span>{lesson.professor}</span>
                            </div>

                            {lesson.group && (
                                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                    <span>{lesson.group}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
