-- Registro de migrations aplicadas — permite atualizações incrementais
-- (aplicar só as migrations NOVAS numa atualização, sem rodar tudo de novo).
CREATE TABLE IF NOT EXISTS schema_migrations (
  version    text        PRIMARY KEY,   -- nome do arquivo, ex: '004_aula_config.sql'
  applied_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE schema_migrations ENABLE ROW LEVEL SECURITY;
-- Sem policies: só o service role (via /setup e /atualizar) acessa.

-- Backfill idempotente das migrations-base + esta. Numa instalação que já tinha
-- as tabelas (rodou 001–005 no setup), isso apenas registra o histórico correto.
INSERT INTO schema_migrations (version) VALUES
  ('001_aula_chat.sql'),
  ('002_aula_eventos.sql'),
  ('003_aula_inscritos.sql'),
  ('004_aula_config.sql'),
  ('005_aula_roteiro.sql'),
  ('006_schema_migrations.sql')
ON CONFLICT (version) DO NOTHING;
