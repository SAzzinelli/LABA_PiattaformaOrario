import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from './supabase'

const secret = process.env.JWT_SECRET || 'laba-secret-key-change-in-production'

export interface AdminUser {
  email: string
  password: string
}

// Default admin credentials (per inizializzazione)
const ADMIN_EMAIL = 'admin@labafirenze.com'
const ADMIN_PASSWORD = 'laba2025'

// Inizializza l'admin nel database se non esiste
export async function initializeAdmin(): Promise<void> {
  if (!supabaseAdmin) {
    console.warn('Supabase admin client not available, skipping admin initialization')
    return
  }

  try {
    // Verifica se l'admin esiste già
    const { data: existingAdmin } = await supabaseAdmin
      .from('admin_users')
      .select('*')
      .eq('email', ADMIN_EMAIL)
      .single()

    if (!existingAdmin) {
      // Crea l'admin se non esiste
      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10)
      await supabaseAdmin.from('admin_users').insert({
        email: ADMIN_EMAIL,
        password_hash: hashedPassword,
      })
      console.log('Admin user initialized in database')
    }
  } catch (error) {
    console.error('Error initializing admin:', error)
  }
}

export async function verifyCredentials(email: string, password: string): Promise<boolean> {
  if (!supabaseAdmin) {
    // Fallback a credenziali hardcoded se Supabase non è configurato
    if (email === ADMIN_EMAIL) {
      const hashed = await bcrypt.hash(ADMIN_PASSWORD, 10)
  return await bcrypt.compare(password, hashed)
    }
    return false
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('admin_users')
      .select('password_hash')
      .eq('email', email)
      .single()

    if (error || !data) {
      return false
    }

    return await bcrypt.compare(password, data.password_hash)
  } catch (error) {
    console.error('Error verifying credentials:', error)
    return false
  }
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
