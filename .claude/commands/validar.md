---
description: Roda o checklist de saúde do projeto antes de publicar.
---

Valide o projeto e reporte ✔/✖ para cada item:
1. `npm run build` passa.
2. `npm run lint` passa.
3. Se existir script `test` no `package.json`, `npm run test` passa.
4. Rotas/telas principais respondem (suba `npm run dev` e cheque o essencial).
5. Configuração específica do produto presente, se aplicável.

Se algo falhar, NÃO recomende publicar — proponha a correção (ou rode `/doctor`).
