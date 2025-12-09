import { generateTimeLines, getTimePosition, getTotalCalendarHeight, getLessonSlots } from '@/lib/timeSlots'
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
                                    // Calcola la durata in slot usando getLessonSlots
                                    const slotCount = getLessonSlots(lesson.startTime, lesson.endTime)
                                    const height = slotCount * rowHeight

                                    return (
                                        <div
                                            key={lesson.id}
                                            className="absolute left-0 right-0 z-10"
                                            style={{
                                                top: `${startPos * rowHeight}px`,
                                                height: `${Math.max(height, 20)}px`,
                                                paddingTop: '2px',
                                                paddingBottom: '2px',
                                                paddingLeft: '2px',
                                                paddingRight: '2px',
                                            }}
                                        >
                                            <LessonEventCard
                                                lesson={lesson}
                                                startSlot={startPos}
                                                slotCount={slotCount}
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
    slotCount: number
    onEdit?: (lesson: Lesson) => void
    onView?: () => void
}

function LessonEventCard({ lesson, startSlot, slotCount, onEdit, onView }: LessonEventCardProps) {
    const formatTime = (time: string) => time.substring(0, 5)
    const courseColor = getCourseColor(lesson.course, lesson.year)

    const handleClick = () => {
        if (onEdit) onEdit(lesson)
        else if (onView) onView()
    }

    return (
        <div
            className={`absolute left-0 right-0 h-full rounded cursor-pointer overflow-hidden group border-l-4 border border-gray-200 ${courseColor.border} ${courseColor.bg} hover:opacity-90 smooth-transition hover:-translate-y-0.5 hover:shadow-md`}
            style={{
                top: '0px',
                borderLeftColor: courseColor.borderColor,
            }}
            onClick={handleClick}
            title={`${lesson.title} - ${formatTime(lesson.startTime)}-${formatTime(lesson.endTime)} - ${lesson.classroom}`}
        >
            <div className="px-1.5 py-1.5 h-full flex flex-col">
                <div className={`text-[11px] font-medium ${courseColor.text} leading-tight`}>
                    {formatTime(lesson.startTime)} - {formatTime(lesson.endTime)}
                </div>
                <div className={`text-[11px] font-semibold ${courseColor.text} leading-tight`} style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                    {lesson.title}
                </div>
                {slotCount * 60 > 40 && (
                    <>
                        {lesson.course && lesson.year && (
                            <div className="inline-block px-1.5 py-0.5 rounded-full text-[9px] font-semibold mt-0.5 whitespace-nowrap w-fit" style={{ backgroundColor: courseColor.borderColor, color: courseColor.textHex }}>
                                {getCourseCode(lesson.course)} {lesson.year}
                            </div>
                        )}
                        <div className={`text-[10px] ${courseColor.text} opacity-80 truncate mt-0.5`}>
                            Prof. {lesson.professor}
                        </div>
                        <div className={`text-[10px] font-semibold ${courseColor.text} opacity-80 truncate mt-0.5`}>
                            {lesson.group ? `Gruppo ${lesson.group}` : 'Tutti'}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
