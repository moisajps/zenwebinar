-- Roteiro do chat populado, sincronizado por tempo. Editado pelo admin.
CREATE TABLE aula_roteiro (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  delay_segundos  int         NOT NULL,
  nome            text        NOT NULL,
  mensagem        text        NOT NULL,
  ordem           int         NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX aula_roteiro_ordem_idx ON aula_roteiro (delay_segundos, ordem);
ALTER TABLE aula_roteiro ENABLE ROW LEVEL SECURITY;
-- Sem policies: leitura server-side (service role); escrita só service role.
