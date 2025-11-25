import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import CustomMultiSelect from './CustomMultiSelect'

interface CalendarHeaderProps {
    currentDate: Date
    onNavigate: (direction: 'prev' | 'next' | 'today') => void
    selectedClassrooms: string[]
    onClassroomsChange: (classrooms: string[]) => void
    allClassrooms: string[]
}

export default function CalendarHeader({
    currentDate,
    onNavigate,
    selectedClassrooms,
    onClassroomsChange,
    allClassrooms
}: CalendarHeaderProps) {
    return (
        <div className="sticky top-0 z-20 bg-laba-primary text-white p-2 sm:p-3 rounded-t-lg shadow-md hover:transform-none">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3">
                {/* Data */}
                <div className="min-w-0 flex-shrink">
                    <div className="font-bold text-base sm:text-lg md:text-xl uppercase tracking-wide truncate">
                        {format(currentDate, 'EEEE', { locale: it })}
                    </div>
                    <div className="text-[10px] sm:text-xs md:text-sm opacity-90 mt-0.5 truncate">
                        {format(currentDate, 'd MMMM yyyy', { locale: it })}
                    </div>
                </div>

                {/* Pulsanti navigazione al centro */}
                <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 justify-center order-2 sm:order-2">
                    <button
                        onClick={() => onNavigate('prev')}
                        className="btn-modern px-2 sm:px-3 py-1.5 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white text-sm font-medium backdrop-blur-sm whitespace-nowrap"
                        title="Giorno precedente"
                    >
                        <span className="relative z-10">←</span>
                    </button>
                    <button
                        onClick={() => onNavigate('today')}
                        className="btn-modern px-3 sm:px-4 py-1.5 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white text-xs sm:text-sm font-medium backdrop-blur-sm whitespace-nowrap"
                    >
                        <span className="relative z-10">Oggi</span>
                    </button>
                    <button
                        onClick={() => onNavigate('next')}
                        className="btn-modern px-2 sm:px-3 py-1.5 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white text-sm font-medium backdrop-blur-sm whitespace-nowrap"
                        title="Giorno successivo"
                    >
                        <span className="relative z-10">→</span>
                    </button>
                </div>

                {/* Dropdown aule a destra */}
                <div className="flex items-center justify-end order-3 sm:order-3">
                    <CustomMultiSelect
                        values={selectedClassrooms}
                        options={allClassrooms.map(c => ({ value: c, label: c }))}
                        placeholder="Aule"
                        onChange={onClassroomsChange}
                        className="w-full sm:w-auto"
                        buttonClassName="bg-white bg-opacity-20 hover:bg-opacity-30 text-white text-xs font-medium backdrop-blur-sm rounded-lg px-3 sm:px-4 py-1.5 border-0"
                        showSelectedCount={false}
                        showSelectAll={true}
                        showClear={true}
                    />
                </div>
            </div>
        </div>
    )
}
