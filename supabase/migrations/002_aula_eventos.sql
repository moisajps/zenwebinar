CREATE TABLE aula_eventos (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  timestamptz NOT NULL DEFAULT now(),
  aula_date   date        NOT NULL,
  session_id  text        NOT NULL,
  email       text,
  event_type  text        NOT NULL,
  metadata    jsonb
);
CREATE INDEX aula_eventos_date_type_idx ON aula_eventos (aula_date, event_type, created_at);
CREATE INDEX aula_eventos_date_session_idx ON aula_eventos (aula_date, session_id);
ALTER TABLE aula_eventos ENABLE ROW LEVEL SECURITY;
