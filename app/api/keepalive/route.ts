import { NextResponse } from 'next/server'
import { getLessons } from '@/lib/db'

export async function GET() {
  try {
    // Esegui una query semplice per mantenere attivo il database
    // Non restituiamo i dati, solo verifichiamo che la connessione funzioni
    await getLessons({})
    
    return NextResponse.json({ 
      status: 'ok', 
      message: 'Database connection active',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Keepalive error:', error)
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Database connection failed',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
