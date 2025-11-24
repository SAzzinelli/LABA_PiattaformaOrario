import { NextResponse } from 'next/server'
import { initializeAdmin } from '@/lib/auth'

// Endpoint per inizializzare l'admin nel database
// Chiamare questo endpoint una volta dopo aver eseguito lo schema SQL
export async function POST() {
  try {
    await initializeAdmin()
    return NextResponse.json({ success: true, message: 'Admin initialized' })
  } catch (error) {
    console.error('Error initializing admin:', error)
    return NextResponse.json(
      { error: 'Errore durante l\'inizializzazione dell\'admin' },
      { status: 500 }
    )
  }
}

