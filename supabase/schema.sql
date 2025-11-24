-- Schema per la piattaforma LABA Orario
-- Eseguire questo script nel SQL Editor di Supabase

-- Tabella per le lezioni
CREATE TABLE IF NOT EXISTS lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  classroom VARCHAR(100) NOT NULL,
  professor VARCHAR(255) NOT NULL,
  group_name VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indici per migliorare le performance
CREATE INDEX IF NOT EXISTS idx_lessons_day_of_week ON lessons(day_of_week);
CREATE INDEX IF NOT EXISTS idx_lessons_start_time ON lessons(start_time);

-- Tabella per gli admin (se necessario in futuro)
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserire l'admin di default (password: laba2025)
-- La password verrà hashat dal codice, questo è solo un placeholder
INSERT INTO admin_users (email, password_hash)
VALUES ('admin@labafirenze.com', '$2a$10$placeholder')
ON CONFLICT (email) DO NOTHING;

-- Funzione per aggiornare updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger per aggiornare updated_at
CREATE TRIGGER update_lessons_updated_at
  BEFORE UPDATE ON lessons
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Abilitare Row Level Security (RLS) se necessario
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Policy per permettere la lettura pubblica delle lezioni
CREATE POLICY "Public lessons are viewable by everyone"
  ON lessons FOR SELECT
  USING (true);

-- Policy per permettere solo agli admin di modificare le lezioni
-- (Questo sarà gestito dal backend con JWT, ma è una sicurezza aggiuntiva)
CREATE POLICY "Only admins can modify lessons"
  ON lessons FOR ALL
  USING (false)
  WITH CHECK (false);

-- Policy per proteggere admin_users
CREATE POLICY "Admin users are private"
  ON admin_users FOR ALL
  USING (false)
  WITH CHECK (false);

