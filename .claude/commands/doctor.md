---
description: Diagnostica e conserta problemas de ambiente (Node, deps, build) e configuração.
---

Aja como suporte técnico do projeto. Em português, diagnostique e, quando seguro,
conserte — confirmando antes de mudanças. Reporte cada item com ✔/✖:

1. Rode `node setup/check.mjs` (verifica node/git/claude e mostra como instalar o que
   faltar). Se nem `node` responder, oriente reabrir o terminal ou ver `docs/prerequisitos.md`.
2. `npm install` roda sem erro? Se falhar, leia a saída e corrija (versões, lockfile).
3. `npm run build` passa? Se falhar, leia o erro e proponha a correção mínima.
4. `npm run lint` passa? (e `npm run test`, se existir o script.)
5. Configuração específica do produto (chaves/.config) presente, se aplicável.

Ao final, liste o que estava errado, o que foi corrigido e o que ainda precisa de ação
do usuário. Nunca exponha chaves completas.
