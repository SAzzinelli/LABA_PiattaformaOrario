-- Fix constraint su year per permettere anche biennali (1-2)
-- Eseguire questo script nel SQL Editor di Supabase

-- Rimuovi il constraint esistente se presente
ALTER TABLE lessons DROP CONSTRAINT IF EXISTS lessons_year_check;

-- Aggiungi nuovo constraint che permette 1-3 (per triennali e biennali)
ALTER TABLE lessons ADD CONSTRAINT lessons_year_check CHECK (year IS NULL OR (year >= 1 AND year <= 3));




