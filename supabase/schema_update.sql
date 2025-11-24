-- Aggiornamento schema per aggiungere corso e anno alle lezioni
-- Eseguire questo script nel SQL Editor di Supabase DOPO aver eseguito schema.sql

-- Aggiungi colonne corso e anno alla tabella lessons
ALTER TABLE lessons 
ADD COLUMN IF NOT EXISTS course VARCHAR(100),
ADD COLUMN IF NOT EXISTS year INTEGER CHECK (year >= 1 AND year <= 3);

-- Crea indice per migliorare le performance delle query filtrate
CREATE INDEX IF NOT EXISTS idx_lessons_course ON lessons(course);
CREATE INDEX IF NOT EXISTS idx_lessons_year ON lessons(year);
CREATE INDEX IF NOT EXISTS idx_lessons_course_year ON lessons(course, year);

