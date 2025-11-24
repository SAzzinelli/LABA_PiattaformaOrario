import { NextRequest, NextResponse } from 'next/server'
import { verifyCredentials, createToken, initializeAdmin } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e password sono richiesti' },
        { status: 400 }
      )
    }

    // Inizializza l'admin se non esiste (solo al primo login)
    await initializeAdmin()

    const isValid = await verifyCredentials(email, password)

    if (!isValid) {
      return NextResponse.json(
        { error: 'Credenziali non valide' },
        { status: 401 }
      )
    }

    const token = await createToken(email)

    const response = NextResponse.json({ success: true })
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
    })

    return response
  } catch (error) {
    return NextResponse.json(
      { error: 'Errore durante il login' },
      { status: 500 }
    )
  }
}

