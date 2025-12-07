-- Schema per Dashboard KPI: Assenze, Recuperi, Cambi Aula
-- Eseguire questo script nel SQL Editor di Supabase

-- Tabella per le assenze dei professori
CREATE TABLE IF NOT EXISTS professor_absences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professor VARCHAR(255) NOT NULL,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  reason TEXT,
  is_notified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indici per assenze
CREATE INDEX IF NOT EXISTS idx_absences_professor ON professor_absences(professor);
CREATE INDEX IF NOT EXISTS idx_absences_date ON professor_absences(date);
CREATE INDEX IF NOT EXISTS idx_absences_lesson ON professor_absences(lesson_id);

-- Tabella per i recuperi programmati
CREATE TABLE IF NOT EXISTS makeup_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  professor VARCHAR(255) NOT NULL,
  classroom VARCHAR(100) NOT NULL,
  scheduled_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  group_name VARCHAR(100),
  course VARCHAR(100),
  year INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indici per recuperi
CREATE INDEX IF NOT EXISTS idx_makeup_scheduled_date ON makeup_lessons(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_makeup_professor ON makeup_lessons(professor);
CREATE INDEX IF NOT EXISTS idx_makeup_original_lesson ON makeup_lessons(original_lesson_id);

-- Tabella per i cambi aula momentanei
CREATE TABLE IF NOT EXISTS classroom_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  original_classroom VARCHAR(100) NOT NULL,
  new_classroom VARCHAR(100) NOT NULL,
  change_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  reason TEXT,
  is_temporary BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indici per cambi aula
CREATE INDEX IF NOT EXISTS idx_classroom_changes_date ON classroom_changes(change_date);
CREATE INDEX IF NOT EXISTS idx_classroom_changes_lesson ON classroom_changes(lesson_id);
CREATE INDEX IF NOT EXISTS idx_classroom_changes_active ON classroom_changes(is_temporary, change_date);

-- Funzioni per aggiornare updated_at
CREATE TRIGGER update_absences_updated_at
  BEFORE UPDATE ON professor_absences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_makeup_updated_at
  BEFORE UPDATE ON makeup_lessons
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_classroom_changes_updated_at
  BEFORE UPDATE ON classroom_changes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Abilitare RLS
ALTER TABLE professor_absences ENABLE ROW LEVEL SECURITY;
ALTER TABLE makeup_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE classroom_changes ENABLE ROW LEVEL SECURITY;

-- Policy per lettura pubblica (per dashboard)
CREATE POLICY "Public absences are viewable by everyone"
  ON professor_absences FOR SELECT
  USING (true);

CREATE POLICY "Public makeup lessons are viewable by everyone"
  ON makeup_lessons FOR SELECT
  USING (true);

CREATE POLICY "Public classroom changes are viewable by everyone"
  ON classroom_changes FOR SELECT
  USING (true);

-- Policy per modifiche solo agli admin (gestito dal backend)
CREATE POLICY "Only admins can modify absences"
  ON professor_absences FOR ALL
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Only admins can modify makeup lessons"
  ON makeup_lessons FOR ALL
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Only admins can modify classroom changes"
  ON classroom_changes FOR ALL
  USING (false)
  WITH CHECK (false);

