-- Fix RLS policies per la tabella lessons
-- Eseguire questo script nel SQL Editor di Supabase

-- Rimuovi le policy esistenti che bloccano tutto
DROP POLICY IF EXISTS "Public lessons are viewable by everyone" ON lessons;
DROP POLICY IF EXISTS "Only admins can modify lessons" ON lessons;

-- Disabilita RLS per lessons (il service role key bypassa comunque RLS)
-- Questo permette al backend di inserire/modificare lezioni
ALTER TABLE lessons DISABLE ROW LEVEL SECURITY;

-- Alternativa: Se vuoi mantenere RLS, crea policy che permettono tutto
-- (ma il service role key bypassa comunque RLS, quindi non è necessario)
-- ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
-- 
-- CREATE POLICY "Allow all operations on lessons"
--   ON lessons FOR ALL
--   USING (true)
--   WITH CHECK (true);


