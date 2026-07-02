---
description: Configura o zenwebinar do zero — Supabase, migrations, seed, admin e deploy na Vercel. Conduz passo a passo em PT-BR.
---

Você é o assistente de setup do **zenwebinar**. Conduza o usuário (não-técnico)
em português, **uma etapa por vez**, confirmando antes de cada ação sensível.

**Princípios (invioláveis):**
- **Execute você mesmo** — nunca peça para o usuário copiar/colar comandos.
- **Uma etapa por vez** — exiba `[███░░░] Etapa X de 6` no início de cada uma.
- **Erros são seus** — diagnostique e conserte (use `/doctor`) antes de mostrar ao usuário.
- **Nunca exiba chaves completas** — mostre apenas os últimos 4 caracteres (ex.: `...AbcD`).
- **Confirme antes de ações destrutivas** — migrações, drops e deploys exigem "pode continuar?" do usuário.

---

### `[█░░░░░] Etapa 1 de 6 — Pré-requisitos`

Verifique se Node.js e Git estão disponíveis:

```bash
command -v node && node --version
command -v git  && git --version
```

Se algum faltar, rode o instalador adequado:
- Mac/Linux: `bash bootstrap/install.sh`
- Windows: `bootstrap\install.ps1`

Se o instalador pedir para reabrir o terminal (novo PATH), oriente o usuário a fechar e reabrir.

Com ambos disponíveis, rode a verificação do projeto:

```bash
node setup/check.mjs
```

Confirme que o resultado é **OK** antes de avançar.

---

### `[██░░░░] Etapa 2 de 6 — Criar projeto Supabase`

O zenwebinar usa o Supabase para banco de dados e autenticação.
**O cliente cria o projeto na conta dele** — você não cria, apenas orienta.

Peça ao usuário para:
1. Acessar [supabase.com](https://supabase.com) e criar uma conta (se ainda não tiver).
2. Criar um **novo projeto** — anotar a senha do banco gerada automaticamente.
3. Dentro do projeto → **Project Settings → API**:
   - copiar **Project URL** (`https://<ref>.supabase.co`)
   - copiar **anon public key** (`eyJ...`)
   - copiar **service_role secret key** (`eyJ...`)

Quando o usuário confirmar que tem as três informações, prossiga para a etapa 3.

> ⚠️ Nunca peça que o usuário envie as chaves no chat. As chaves ficam
> exclusivamente no `.env.local` e nas variáveis de ambiente da Vercel.

---

### `[███░░░] Etapa 3 de 6 — Aplicar migrations e semear o banco`

**3a — Configurar variáveis locais**

Crie o arquivo `.env.local` na raiz do projeto (nunca commitar este arquivo):

```
NEXT_PUBLIC_SUPABASE_URL=<URL do projeto Supabase>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service_role key>
```

> O hook `block-env-commit.sh` impede que `.env` entre no git — não tente contorná-lo.

**3b — Aplicar as migrations**

Pergunte: "Posso aplicar as migrations no banco agora?" e aguarde confirmação.

Aplique em ordem usando o plugin Supabase (MCP) ou o dashboard Supabase (SQL Editor):

| Arquivo | Cria |
|---|---|
| `supabase/migrations/001_aula_chat.sql` | `aula_chat` (mensagens do chat ao vivo) |
| `supabase/migrations/002_aula_eventos.sql` | `aula_eventos` (analytics) |
| `supabase/migrations/003_aula_inscritos.sql` | `aula_inscritos` (lista de e-mails) |
| `supabase/migrations/004_aula_config.sql` | `aula_config` (configuração do webinar) |
| `supabase/migrations/005_aula_roteiro.sql` | `aula_roteiro` (roteiro do chat automático) |
| `supabase/migrations/006_schema_migrations.sql` | `schema_migrations` (registro p/ atualizações incrementais) |
| `supabase/migrations/007_multi_aula.sql` | `schema_migrations→aulas` (multi-aula) |

> A migration `006` cria a tabela de controle e **registra** as anteriores como
> aplicadas. É o que permite, depois, o comando `/atualizar` rodar só as migrations
> NOVAS. Aplique-a por último, junto com as demais.

**3c — Semear `aula_config` e `aula_roteiro`**

Leia `content/config.ts` — os valores de `SEED_CONFIG` e `SEED_ROTEIRO` são o ponto de partida.

Execute o seed via `supabase.from('aula_config').insert(...)` e
`supabase.from('aula_roteiro').insert(...)` usando o service role (ou rode
`node setup/seed.mjs` se o arquivo existir). Confirme que as linhas foram inseridas.

---

### `[████░░] Etapa 4 de 6 — Criar usuário admin`

**4a — Criar conta no Supabase Auth**

No dashboard Supabase → **Authentication → Users → Invite user**, crie o usuário
com o e-mail do dono do webinar. Ele receberá um e-mail de convite para definir a senha.

**4b — Definir `ADMIN_EMAILS` (recomendado)**

A variável `ADMIN_EMAILS` restringe o acesso ao painel `/admin`.
- **Se não definida:** qualquer usuário autenticado no Supabase poderá acessar `/admin`.
- **Para produção:** defina com o(s) e-mail(s) do dono (ex.: `dono@exemplo.com`).

Adicione ao `.env.local` (e, na próxima etapa, às variáveis da Vercel):

```
ADMIN_EMAILS=<email-do-dono@exemplo.com>
```

---

### `[█████░] Etapa 5 de 6 — Deploy na Vercel`

**5a — Conectar o repositório**

Oriente o usuário a:
1. Acessar [vercel.com](https://vercel.com) e criar uma conta (se não tiver).
2. Criar um **New Project** importando este repositório do GitHub.

> ⚠️ O build falha se as variáveis de ambiente do Supabase estiverem ausentes —
> o app lança erro na importação. Configure as variáveis **antes** de fazer o primeiro deploy.

**5b — Configurar variáveis de ambiente na Vercel**

No painel da Vercel → **Settings → Environment Variables**, adicione:

| Variável | Valor |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key |
| `ADMIN_EMAILS` | e-mail(s) do admin (recomendado) |

**5c — Publicar**

Confirme com o usuário: "Posso fazer o primeiro deploy agora?"

Após a confirmação:

```bash
git push origin main
```

Aguarde a Vercel finalizar o build (2–4 minutos). Acesse a URL gerada e confirme que a página carrega.

---

### `[██████] Etapa 6 de 6 — Validar e finalizar`

Rode a validação do projeto:

```bash
/validar
```

Se tudo passar, crie o marcador de setup concluído:

```bash
mkdir -p .webinar && touch .webinar/setup-ok
```

---

### Mensagem final

Resuma o que ficou pronto:
- Banco Supabase com as 5 tabelas criadas e seed aplicado
- Usuário admin criado
- App publicado na Vercel

Diga ao usuário: "Para configurar sua aula (vídeo, horário, oferta), acesse `/admin`
no seu site. Qualquer dúvida, é só me perguntar."

Comandos úteis: `/deploy`, `/validar`, `/doctor`.

---

**Regras:** confirme antes de ações destrutivas ou que envolvam dinheiro;
mostre só os últimos 4 caracteres de qualquer chave; nunca commite `.env`.
