'use client'

import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import DashboardKPI from '@/components/DashboardKPI'

export default function Home() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="container mx-auto px-4 py-8 flex-1">
        {/* Hero Section */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Avvisi e Orario lezioni
          </h1>
          <p className="text-lg text-gray-600">
            Monitora assenze, recuperi e cambi aula in tempo reale
          </p>
        </div>

        {/* Quick Navigation - Orari */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <button
            onClick={() => router.push('/badia-ripoli')}
            className="flex items-center justify-between bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-200 group border border-gray-200"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#033157' }}>
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <span className="text-base font-semibold text-gray-900">Piazza di Badia a Ripoli</span>
            </div>
            <svg 
              className="w-6 h-6 text-gray-400 group-hover:translate-x-1 transition-transform" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <button
            onClick={() => router.push('/via-vecchietti')}
            className="flex items-center justify-between bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-200 group border border-gray-200"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#033157' }}>
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <span className="text-base font-semibold text-gray-900">Via de&apos; Vecchietti</span>
            </div>
            <svg 
              className="w-6 h-6 text-gray-400 group-hover:translate-x-1 transition-transform" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* KPI Dashboard */}
        <DashboardKPI />

      </main>
    </div>
  )
}

