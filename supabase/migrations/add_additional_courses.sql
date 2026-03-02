-- Lezioni condivise tra più corsi (es. Arte per GD3 + Pittura2 + Fot2)
-- additional_courses: array di {course, year} dove la lezione appare oltre al corso principale
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS additional_courses JSONB DEFAULT '[]';
