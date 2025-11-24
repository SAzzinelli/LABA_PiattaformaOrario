import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

const secret = process.env.JWT_SECRET || 'laba-secret-key-change-in-production'

export interface AdminUser {
  email: string
  password: string
}

// Default admin credentials
const ADMIN_EMAIL = 'admin@labafirenze.com'
const ADMIN_PASSWORD = 'laba2025'

// Hash password on first run (in production, this should be done separately)
let hashedPassword: string | null = null

async function getHashedPassword(): Promise<string> {
  if (!hashedPassword) {
    hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10)
  }
  return hashedPassword
}

export async function verifyCredentials(email: string, password: string): Promise<boolean> {
  if (email !== ADMIN_EMAIL) return false
  const hashed = await getHashedPassword()
  return await bcrypt.compare(password, hashed)
}

export async function createToken(email: string): Promise<string> {
  return jwt.sign({ email }, secret, { expiresIn: '24h' })
}

export async function verifyToken(token: string): Promise<{ email: string } | null> {
  try {
    const payload = jwt.verify(token, secret) as { email: string }
    return payload
  } catch {
    return null
  }
}

