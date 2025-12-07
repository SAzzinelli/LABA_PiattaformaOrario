'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Reindirizza alla sede di default (Badia a Ripoli)
    router.push('/badia-ripoli')
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="container mx-auto px-2 py-2 flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-laba-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento...</p>
        </div>
      </main>
    </div>
  )
}

