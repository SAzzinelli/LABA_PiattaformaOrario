// Script per correggere le policy di admin_users su Supabase
// Esegui: node scripts/fix-admin-policy.js

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Carica variabili d'ambiente da .env.local
const envPath = path.join(__dirname, '..', '.env.local')
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8')
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/)
    if (match) {
      process.env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '')
    }
  })
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Errore: NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY devono essere configurate in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function fixAdminPolicy() {
  console.log('🔧 Correzione policy admin_users...')

  try {
    // Disabilita RLS per admin_users
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;'
    })

    if (rlsError) {
      // Prova con query diretta
      console.log('⚠️  RPC non disponibile, provo metodo alternativo...')
      
      // Verifica se l'admin esiste
      const { data: existingAdmin, error: checkError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', 'admin@labafirenze.com')
        .single()

      if (checkError && checkError.code === 'PGRST116') {
        console.log('ℹ️  Admin non trovato, verrà creato al prossimo login')
      } else if (existingAdmin) {
        console.log('✅ Admin già esistente nel database')
      }

      // Prova a creare/aggiornare l'admin direttamente
      const bcrypt = require('bcryptjs')
      const hashedPassword = await bcrypt.hash('laba2025', 10)
      
      const { error: upsertError } = await supabase
        .from('admin_users')
        .upsert({
          email: 'admin@labafirenze.com',
          password_hash: hashedPassword,
        }, {
          onConflict: 'email'
        })

      if (upsertError) {
        console.error('❌ Errore durante la creazione/aggiornamento admin:', upsertError)
        console.log('\n📝 Esegui manualmente questo script SQL su Supabase:')
        console.log('ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;')
        return
      }

      console.log('✅ Admin creato/aggiornato con successo!')
    } else {
      console.log('✅ RLS disabilitato per admin_users')
    }

    console.log('\n✅ Completato! Ora puoi fare login con:')
    console.log('   Email: admin@labafirenze.com')
    console.log('   Password: laba2025')
  } catch (error) {
    console.error('❌ Errore:', error)
    console.log('\n📝 Esegui manualmente questo script SQL su Supabase SQL Editor:')
    console.log('ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;')
  }
}

fixAdminPolicy()

