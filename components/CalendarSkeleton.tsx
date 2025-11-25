export default function CalendarSkeleton() {
    return (
        <div className="flex-1 flex flex-col bg-white border border-gray-200 rounded-b-lg overflow-hidden animate-pulse">
            {/* Header aule */}
            <div className="border-b border-gray-300 bg-gray-50 flex">
                <div className="w-16 border-r border-gray-300 bg-gray-50 h-10"></div>
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex-1 border-r border-gray-200 h-10 bg-gray-100"></div>
                ))}
            </div>

            {/* Griglia */}
            <div className="flex-1 relative flex">
                {/* Colonna orari */}
                <div className="w-16 border-r border-gray-300 bg-white flex flex-col">
                    {[...Array(12)].map((_, i) => (
                        <div key={i} className="flex-1 border-b border-gray-100 relative">
                            <div className="absolute -top-2 right-2 w-8 h-3 bg-gray-100 rounded"></div>
                        </div>
                    ))}
                </div>

                {/* Colonne aule */}
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex-1 border-r border-gray-200 relative">
                        {/* Fake lessons */}
                        <div className="absolute top-20 left-1 right-1 h-32 bg-blue-100 rounded border-l-4 border-blue-300 opacity-50"></div>
                        <div className="absolute top-60 left-1 right-1 h-24 bg-green-100 rounded border-l-4 border-green-300 opacity-50"></div>
                        <div className="absolute top-96 left-1 right-1 h-40 bg-purple-100 rounded border-l-4 border-purple-300 opacity-50"></div>
                    </div>
                ))}
            </div>
        </div>
    )
}
