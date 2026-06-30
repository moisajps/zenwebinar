---
description: Publica o projeto no ar (git push → Vercel). Confirma antes.
---

Publique as alterações com segurança:
1. Rode `/validar` primeiro. Se algo falhar, pare e conserte.
2. Mostre ao usuário o resumo do que mudou (`git status` / `git diff --stat`).
3. **Confirme** com o usuário antes de publicar ("posso publicar?").
4. Só então: `git add -A`, `git commit -m "<mensagem clara>"`, `git push`.
   (Antes do `git add -A`, confirme que `.config/` e `.env*` estão no `.gitignore`;
   o hook `block-env-commit.sh` também barra qualquer `.env`.)
5. A Vercel publica em 1-2 min. Informe a URL e como reverter ("reverte a última publicação").

Nunca faça `git push --force` nem publique sem a confirmação do passo 3.
