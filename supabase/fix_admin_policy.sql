-- Fix per le policy di admin_users
-- Eseguire questo script nel SQL Editor di Supabase

-- Rimuovi la policy esistente che blocca tutto
DROP POLICY IF EXISTS "Admin users are private" ON admin_users;

-- Disabilita RLS per admin_users (il service role key bypassa comunque RLS)
-- Oppure crea una policy che permette l'accesso al service role
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;

-- Alternativa: se vuoi mantenere RLS, crea una policy che permette l'accesso
-- (ma il service role key bypassa comunque RLS, quindi non è necessario)
-- CREATE POLICY "Service role can access admin_users"
--   ON admin_users FOR ALL
--   USING (true)
--   WITH CHECK (true);

-- Verifica che l'admin esista, altrimenti crealo manualmente
-- (il codice lo creerà automaticamente, ma se c'è un problema con RLS potrebbe non funzionare)
-- DELETE FROM admin_users WHERE email = 'admin@labafirenze.com';
-- INSERT INTO admin_users (email, password_hash)
-- VALUES ('admin@labafirenze.com', '$2a$10$placeholder')
-- ON CONFLICT (email) DO NOTHING;




