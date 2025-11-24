import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value

  if (!token) {
    return NextResponse.json({ authenticated: false })
  }

  const payload = await verifyToken(token)

  if (!payload) {
    return NextResponse.json({ authenticated: false })
  }

  return NextResponse.json({ authenticated: true, email: payload.email })
}

