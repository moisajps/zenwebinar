-- 007_multi_aula.sql — aulas como entidades (não-destrutivo, idempotente).
-- aula_config passa a ser a tabela de entidades: 1 linha = 1 aula.

ALTER TABLE aula_config ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE aula_config ADD COLUMN IF NOT EXISTS nome text;
ALTER TABLE aula_config ADD COLUMN IF NOT EXISTS arquivada boolean NOT NULL DEFAULT false;

-- backfill nome/slug da(s) linha(s) existente(s)
UPDATE aula_config SET nome = COALESCE(nome, titulo);
UPDATE aula_config
  SET slug = COALESCE(slug, NULLIF(regexp_replace(lower(titulo), '[^a-z0-9]+', '-', 'g'), ''), 'webinar')
  WHERE slug IS NULL;
-- desempate de slug se colidirem
UPDATE aula_config a SET slug = a.slug || '-' || left(a.id::text, 4)
  WHERE EXISTS (SELECT 1 FROM aula_config b WHERE b.slug = a.slug AND b.id <> a.id);

ALTER TABLE aula_config ALTER COLUMN nome SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS aula_config_slug_idx ON aula_config (slug);

-- remover a trava de "só 1 ativa"
DROP INDEX IF EXISTS aula_config_ativa_idx;

-- aula_id (FK) em roteiro/eventos/chat, nullable (código sempre preenche), com backfill
ALTER TABLE aula_roteiro ADD COLUMN IF NOT EXISTS aula_id uuid;
ALTER TABLE aula_eventos ADD COLUMN IF NOT EXISTS aula_id uuid;
ALTER TABLE aula_chat    ADD COLUMN IF NOT EXISTS aula_id uuid;

UPDATE aula_roteiro SET aula_id = (SELECT id FROM aula_config ORDER BY updated_at NULLS FIRST LIMIT 1) WHERE aula_id IS NULL;
UPDATE aula_eventos SET aula_id = (SELECT id FROM aula_config ORDER BY updated_at NULLS FIRST LIMIT 1) WHERE aula_id IS NULL;
UPDATE aula_chat    SET aula_id = (SELECT id FROM aula_config ORDER BY updated_at NULLS FIRST LIMIT 1) WHERE aula_id IS NULL;

ALTER TABLE aula_roteiro DROP CONSTRAINT IF EXISTS aula_roteiro_aula_fk;
ALTER TABLE aula_eventos DROP CONSTRAINT IF EXISTS aula_eventos_aula_fk;
ALTER TABLE aula_chat    DROP CONSTRAINT IF EXISTS aula_chat_aula_fk;
ALTER TABLE aula_roteiro ADD CONSTRAINT aula_roteiro_aula_fk FOREIGN KEY (aula_id) REFERENCES aula_config(id) ON DELETE CASCADE;
ALTER TABLE aula_eventos ADD CONSTRAINT aula_eventos_aula_fk FOREIGN KEY (aula_id) REFERENCES aula_config(id) ON DELETE CASCADE;
ALTER TABLE aula_chat    ADD CONSTRAINT aula_chat_aula_fk    FOREIGN KEY (aula_id) REFERENCES aula_config(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS aula_roteiro_aula_idx ON aula_roteiro (aula_id, delay_segundos, ordem);
CREATE INDEX IF NOT EXISTS aula_eventos_aula_idx ON aula_eventos (aula_id, event_type, created_at);
CREATE INDEX IF NOT EXISTS aula_chat_aula_idx    ON aula_chat (aula_id, created_at);

INSERT INTO schema_migrations (version) VALUES ('007_multi_aula.sql') ON CONFLICT (version) DO NOTHING;
