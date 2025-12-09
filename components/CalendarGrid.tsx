import { generateTimeLines, getTimePosition, getTotalCalendarHeight } from '@/lib/timeSlots'
import { getCourseColor, getCourseCode } from '@/lib/courseColors'
import { Lesson } from '@/hooks/useLessons'

interface CalendarGridProps {
    lessons: Lesson[]
    currentDate: Date
    visibleClassrooms: string[]
    minClassroomWidth: number
    isAuthenticated: boolean
    onEditLesson: (lesson: Lesson) => void
    onViewLesson: (lesson: Lesson) => void
}

export default function CalendarGrid({
    lessons,
    currentDate,
    visibleClassrooms,
    minClassroomWidth,
    isAuthenticated,
    onEditLesson,
    onViewLesson
}: CalendarGridProps) {
    const getLessonsForDay = (date: Date): Lesson[] => {
        const dayOfWeek = date.getDay()
        return lessons.filter(lesson => lesson.dayOfWeek === dayOfWeek)
    }

    const getLessonsForClassroom = (dayLessons: Lesson[], classroom: string): Lesson[] => {
        return dayLessons.filter(lesson => {
            if (classroom === 'Aula Magna') {
                return lesson.classroom === 'Aula Magna' || lesson.classroom === 'Magna 1' || lesson.classroom === 'Magna 2'
            }
            if (classroom === 'Conference') {
                return lesson.classroom === 'Conference' || lesson.classroom === 'Conference 1' || lesson.classroom === 'Conference 2'
            }
            return lesson.classroom === classroom
        })
    }

    const dayLessons = getLessonsForDay(currentDate)
    const rowHeight = 60 // Altezza di default per riga (30 minuti)
    const timeLines = generateTimeLines(rowHeight)
    const totalHeight = getTotalCalendarHeight(rowHeight)

    return (
        <div className="flex-1 flex flex-col bg-white border border-gray-200 rounded-b-lg overflow-hidden">
            <div className="flex-1 overflow-auto relative hide-scrollbar">
                {/* Header aule sticky */}
                <div className="sticky top-0 z-20 bg-white border-b border-gray-300 shadow-sm">
                    <div className="flex" style={{ minWidth: `${visibleClassrooms.length * minClassroomWidth + 64}px` }}>
                        <div className="sticky left-0 z-30 w-16 flex-shrink-0 border-r border-gray-300 bg-gray-50"></div>
                        {visibleClassrooms.map((classroom) => (
                            <div
                                key={classroom}
                                className="flex-shrink-0 border-r border-gray-200 last:border-r-0 px-1 sm:px-2 py-2 text-center text-[10px] sm:text-xs font-bold text-gray-700 bg-gray-50 truncate"
                                style={{ width: `${minClassroomWidth}px`, minWidth: `${minClassroomWidth}px` }}
                                title={classroom}
                            >
                                {classroom}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Griglia oraria */}
                <div className="relative" style={{ minWidth: `${visibleClassrooms.length * minClassroomWidth + 64}px`, height: `${totalHeight}px` }}>
                    {/* Colonna orari sticky */}
                    <div className="sticky left-0 z-30 w-16 border-r border-gray-300 bg-white shadow-sm" style={{ height: `${totalHeight}px` }}>
                        {timeLines.map((line) => (
                            <div
                                key={line.time}
                                className="absolute left-0 right-0 flex items-start pr-2 bg-white"
                                style={{ top: `${line.position - (line.isHour ? 0 : 6)}px` }}
                            >
                                {line.isHour ? (
                                    <span className="text-xs font-medium text-gray-600 ml-auto">{line.time}</span>
                                ) : (
                                    <span className="text-[10px] text-gray-400 ml-auto">{line.time}</span>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Linee orizzontali */}
                    {timeLines.map((line) => (
                        <div
                            key={`line-${line.time}`}
                            className="absolute left-16 right-0 pointer-events-none z-0"
                            style={{
                                top: `${line.position}px`,
                                borderTop: line.isHour ? '1px solid #e5e7eb' : '1px solid #f3f4f6'
                            }}
                        />
                    ))}


                    {/* Colonne aule con eventi */}
                    {visibleClassrooms.map((classroom, classroomIndex) => {
                        const classroomLessons = getLessonsForClassroom(dayLessons, classroom)

                        return (
                            <div
                                key={classroom}
                                className="absolute top-0 bottom-0 flex-shrink-0 border-r border-gray-200 last:border-r-0"
                                style={{
                                    left: `${64 + classroomIndex * minClassroomWidth}px`,
                                    width: `${minClassroomWidth}px`,
                                    minWidth: `${minClassroomWidth}px`
                                }}
                            >
                                {classroomLessons.map((lesson) => {
                                    const startPos = getTimePosition(lesson.startTime)
                                    const endPos = getTimePosition(lesson.endTime)
                                    // Calcola l'altezza includendo lo slot finale (endPos - startPos + 1)
                                    const height = (endPos - startPos + 1) * rowHeight

                                    return (
                                        <div
                                            key={lesson.id}
                                            className="absolute left-0 right-0 z-10 px-1"
                                            style={{
                                                top: `${startPos * rowHeight}px`,
                                                height: `${Math.max(height, 20)}px`,
                                            }}
                                        >
                                            <LessonEventCard
                                                lesson={lesson}
                                                startSlot={startPos}
                                                endSlot={endPos}
                                                onEdit={isAuthenticated ? onEditLesson : undefined}
                                                onView={!isAuthenticated ? () => onViewLesson(lesson) : undefined}
                                            />
                                        </div>
                                    )
                                })}
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

interface LessonEventCardProps {
    lesson: Lesson
    startSlot: number
    endSlot: number
    onEdit?: (lesson: Lesson) => void
    onView?: () => void
}

function LessonEventCard({ lesson, startSlot, endSlot, onEdit, onView }: LessonEventCardProps) {
    const height = endSlot - startSlot
    const formatTime = (time: string) => time.substring(0, 5)
    const courseColor = getCourseColor(lesson.course)

    const handleClick = () => {
        if (onEdit) onEdit(lesson)
        else if (onView) onView()
    }

    return (
        <div
            className={`absolute left-0 right-0 rounded cursor-pointer overflow-hidden group border-l-4 ${courseColor.border} ${courseColor.bg} hover:opacity-90 smooth-transition hover:-translate-y-0.5 hover:shadow-md`}
            style={{
                top: '0px',
                height: `${Math.max(height, 20)}px`,
                borderLeftColor: courseColor.borderColor,
            }}
            onClick={handleClick}
            title={`${lesson.title} - ${formatTime(lesson.startTime)}-${formatTime(lesson.endTime)} - ${lesson.classroom}`}
        >
            <div className="px-1.5 pt-0 pb-1 h-full flex flex-col">
                <div className={`text-[11px] font-medium ${courseColor.text} leading-tight`}>
                    {formatTime(lesson.startTime)} - {formatTime(lesson.endTime)}
                </div>
                <div className={`text-xs font-semibold ${courseColor.text} leading-tight truncate`}>
                    {lesson.title}
                </div>
                {height > 40 && (
                    <>
                        {lesson.course && lesson.year && (
                            <div className={`text-[10px] font-semibold ${courseColor.text} opacity-80 truncate mt-0.5`}>
                                {getCourseCode(lesson.course)} {lesson.year}
                            </div>
                        )}
                        <div className={`text-[10px] ${courseColor.text} opacity-80 truncate mt-0.5`}>
                            {lesson.professor}
                        </div>
                        {lesson.group && (
                            <div className={`text-[10px] font-semibold ${courseColor.text} opacity-80 truncate mt-0.5`}>
                                {lesson.group}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
