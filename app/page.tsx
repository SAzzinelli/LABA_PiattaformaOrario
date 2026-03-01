'use client'

import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import DashboardKPI from '@/components/DashboardKPI'

export default function Home() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 flex flex-col">
      <Header />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14 flex-1 max-w-6xl">
        {/* Hero */}
        <header className="mb-12 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight mb-3">
            Avvisi e Orario lezioni
          </h1>
          <p className="text-base sm:text-lg text-slate-600 max-w-xl mx-auto">
            Monitora assenze, recuperi e cambi aula in tempo reale
          </p>
        </header>

        {/* Sedi - Card moderne */}
        <section className="mb-14">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 text-center">
            Scegli la sede
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl mx-auto">
            <button
              onClick={() => router.push('/badia-ripoli')}
              className="group relative overflow-hidden rounded-2xl bg-white p-6 sm:p-8 text-left shadow-lg shadow-slate-200/60 border border-slate-100 hover:shadow-xl hover:shadow-slate-200/80 hover:border-slate-200 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#033157]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative flex items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg"
                    style={{ backgroundColor: '#033157' }}
                  >
                    <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <span className="text-lg sm:text-xl font-semibold text-slate-900 block">
                      Piazza di Badia a Ripoli
                    </span>
                    <span className="text-sm text-slate-500">Vedi orario lezioni</span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-[#033157] group-hover:text-white transition-colors duration-300">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </button>

            <button
              onClick={() => router.push('/via-vecchietti')}
              className="group relative overflow-hidden rounded-2xl bg-white p-6 sm:p-8 text-left shadow-lg shadow-slate-200/60 border border-slate-100 hover:shadow-xl hover:shadow-slate-200/80 hover:border-slate-200 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#033157]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative flex items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg"
                    style={{ backgroundColor: '#033157' }}
                  >
                    <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <span className="text-lg sm:text-xl font-semibold text-slate-900 block">
                      Via de&apos; Vecchietti
                    </span>
                    <span className="text-sm text-slate-500">Vedi orario lezioni</span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-[#033157] group-hover:text-white transition-colors duration-300">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </button>
          </div>
        </section>

        {/* KPI Dashboard */}
        <section>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 text-center">
            Situazione attuale
          </h2>
          <DashboardKPI />
        </section>
      </main>
    </div>
  )
}
