-- Chat interativo das aulas ao vivo (mensagens reais + oficiais)
CREATE TABLE aula_chat (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  timestamptz NOT NULL DEFAULT now(),
  aula_date   date        NOT NULL,
  user_name   text        NOT NULL,
  message     text        NOT NULL CHECK (char_length(message) BETWEEN 1 AND 300),
  hidden      boolean     NOT NULL DEFAULT false,
  is_official boolean     NOT NULL DEFAULT false
);
CREATE INDEX ON aula_chat (aula_date, created_at);
ALTER TABLE aula_chat ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leitura publica" ON aula_chat FOR SELECT USING (hidden = false);
CREATE POLICY "insercao service role" ON aula_chat FOR INSERT WITH CHECK (auth.role() = 'service_role');
