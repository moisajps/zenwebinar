-- Configuração do webinar, editada pelo admin em runtime. 1 linha ativa.
CREATE TABLE aula_config (
  id                       uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  ativa                    boolean     NOT NULL DEFAULT true,
  updated_at               timestamptz NOT NULL DEFAULT now(),
  titulo                   text        NOT NULL DEFAULT 'Aula ao vivo',
  seo_descricao            text        NOT NULL DEFAULT 'Participe da aula ao vivo.',
  youtube_video_id         text        NOT NULL DEFAULT '',
  inicio_at                timestamptz,
  duracao_min              int         NOT NULL DEFAULT 100,
  recorrencia              jsonb,                       -- { weekday:int, from_date:'YYYY-MM-DD' } | null
  timezone                 text        NOT NULL DEFAULT 'America/Sao_Paulo',
  replay_habilitado        boolean     NOT NULL DEFAULT false,
  pitch_segundos           int         NOT NULL DEFAULT 1800,
  chat_offset_segundos     int         NOT NULL DEFAULT 0,
  ao_vivo_fim_segundos     int         NOT NULL DEFAULT 6000,
  contador_piso            int         NOT NULL DEFAULT 0,
  contador_multiplicador   numeric     NOT NULL DEFAULT 1.0,
  oferta                   jsonb,
  notificacoes             jsonb,
  materiais                jsonb,
  branding                 jsonb       NOT NULL DEFAULT '{"marca":"Webinar","areaLabel":"Área do Aluno","teamName":"Equipe","ogImage":"/og-aula.jpg"}'::jsonb
);
-- Só pode haver 1 config ativa
CREATE UNIQUE INDEX aula_config_ativa_idx ON aula_config (ativa) WHERE ativa = true;
ALTER TABLE aula_config ENABLE ROW LEVEL SECURITY;
-- Sem policies: leitura/escrita só via service role (server).
