# Como atualizar o zenwebinar (guia de atualização)

Este guia explica como uma instalação existente do zenwebinar recebe uma nova
versão do código **sem refazer o setup** e **sem perder a configuração**.

> **Jeito fácil:** rode o comando **`/atualizar`** numa sessão do Claude aberta na
> pasta do projeto — ele conduz tudo abaixo automaticamente (detecta o cenário,
> preserva sua config, aplica só as migrations novas via `schema_migrations`, builda
> e ajuda no deploy). O resto deste guia é o processo manual equivalente.

> **Regra de ouro:** toda a configuração do cliente vive FORA do código —
> no `.env.local` (chaves) e no banco Supabase (conteúdo do webinar, editado
> pelo `/admin`). Atualizar o código nunca toca nisso.

## O que é preservado numa atualização

| Item | Onde vive | Afetado pela atualização? |
|------|-----------|---------------------------|
| Chaves/segredos | `.env.local` (gitignored) | ❌ nunca |
| Config do webinar (título, vídeo, oferta, roteiro) | banco Supabase (`aula_config`, `aula_roteiro`) | ❌ nunca |
| Usuário admin | Supabase Auth | ❌ nunca |
| Marcador de setup | `.webinar/setup-ok` (gitignored) | ❌ nunca |
| Deploy | `.vercel/` (gitignored) | ❌ nunca |
| **Código** (páginas, componentes, APIs) | arquivos versionados | ✅ é o que atualiza |

## Cenário A — o cliente clonou e manteve o histórico do git (recomendado)

É o caso quando `git remote -v` mostra `origin` apontando para
`github.com/moisajps/zenwebinar` (ou o cliente adicionou esse repo como remote).
A atualização é um `git pull` limpo.

```bash
cd <pasta-do-projeto>
git fetch origin
git pull --ff-only origin main   # traz a versão nova (fast-forward)
npm install                      # instala libs novas, se houver
npm run build                    # confirma que builda
# redeploy (ver seção "Deploy" abaixo)
```

> **Validado em 2026-07-01** numa instalação de teste real (origin =
> moisajps/zenwebinar, versão antiga `c33f1e5`): o `pull --ff-only` avançou para
> `1297a29` sem conflito, `.env.local` e `.webinar/setup-ok` permaneceram
> intactos, `npm install` adicionou `next-themes`/`lucide-react`/`driver.js`, e o
> `npm run build` compilou (11 rotas + Proxy). Mods locais do cliente em
> `.gitignore`/`next-env.d.ts` sobreviveram porque a atualização não tocou nesses
> arquivos.

Se o `origin` for o repo PRÓPRIO do cliente (ele subiu num GitHub dele mas manteve
o histórico), adicione o upstream uma vez:

```bash
git remote add upstream https://github.com/moisajps/zenwebinar.git
git fetch upstream
git merge upstream/main          # ou: git rebase upstream/main
git push origin main             # empurra pro repo dele → Vercel redeploya
```

## Cenário B — o cliente fez `git init` do zero (ou baixou ZIP)

Quando não há histórico em comum com o repo de origem (`git log` começa num commit
diferente, ou nem há `.git`). Aqui `git pull`/`merge` NÃO funciona limpo
("refusing to merge unrelated histories"). Use **overlay de arquivos**:

1. Clonar a versão nova num diretório temporário:
   `git clone https://github.com/moisajps/zenwebinar.git /tmp/zw-novo`
2. Copiar **apenas os arquivos de código** por cima do projeto do cliente,
   **preservando** o que é dele: `.env*`, `.webinar/`, `.vercel/`, `node_modules/`,
   e arquivos que ele possa ter customizado (`public/` com imagens próprias,
   `content/config.ts` se editou o seed).
3. `npm install` && `npm run build`.
4. Commit no repo do cliente + redeploy.

> É por isso que a recomendação é **não editar arquivos versionados** — toda
> personalização deve ficar no `/admin` (banco) e no `.env`. Assim a atualização é
> sempre limpa, em qualquer cenário.

## Migrations (banco)

- A maioria das atualizações é **só código** e não mexe no banco (ex.: o Admin
  UX v2 não trouxe migration nenhuma).
- Se uma atualização adicionar um arquivo NOVO em `supabase/migrations/`, é preciso
  aplicar **só o novo** no Supabase do cliente (as antigas já foram aplicadas no
  setup). Conferir com:
  `git diff --name-only <versao-antiga>..<versao-nova> -- supabase/migrations/`
- ⚠️ Hoje não há um registro automático de "quais migrations já foram aplicadas".
  Aplicar só os arquivos novos, na ordem, e conferir no Supabase.

## Deploy

- **Vercel ligada ao GitHub:** o deploy acontece sozinho quando o commit novo chega
  no repo que a Vercel observa (o push para `main`). Basta conferir o deploy mais
  recente no painel da Vercel.
- **Deploy via CLI (`.vercel/` presente):** rodar `vercel --prod` na pasta do
  projeto após a atualização local.

## Checklist rápido de atualização

- [ ] `git remote -v` → identificar Cenário A ou B
- [ ] Cenário A: `git pull --ff-only origin main` (ou merge do `upstream`)
- [ ] Cenário B: overlay de arquivos preservando config
- [ ] `npm install`
- [ ] Migrations novas? aplicar só as novas no Supabase (confirmar antes)
- [ ] `npm run build` (confirma que builda)
- [ ] Redeploy (auto na Vercel via GitHub, ou `vercel --prod`)
- [ ] `.env.local`, `.webinar/setup-ok`, banco → conferir que continuam intactos

## Evolução recomendada

1. **Comando `/atualizar`** no produto (mesma filosofia do `/setup`): o Claude
   conduz o cliente não-técnico — detecta o cenário (A/B), preserva config, aplica
   só migrations novas, builda e redeploya. Elimina a necessidade de passos manuais.
2. **Registro de migrations aplicadas** (uma tabela `schema_migrations` ou uso do
   histórico do Supabase CLI) para saber com segurança o que é novo.
3. **Distribuição via `npx`** (evolução final prevista no spec): pacote com
   `init`/`update` que sobrescreve os arquivos-template e preserva a config —
   o modelo mais robusto e profissional, independente da topologia de git do cliente.

## Notas

- Após um `npm install` de libs novas, rodar `npm audit` para revisar
  vulnerabilidades (o UX v2 acusou 2 — provavelmente transitivas; avaliar antes de
  `npm audit fix --force`, que pode quebrar versões).
