CREATE TABLE aula_inscritos (
  email      text PRIMARY KEY,
  first_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE aula_inscritos ENABLE ROW LEVEL SECURITY;
