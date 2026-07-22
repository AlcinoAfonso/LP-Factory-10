22/07/2026 — Atualização dos Catálogos de Updates

## 1. Estado

- O workflow anterior foi substituído pela skill `$lp-factory-atualizar-catalogos`.
- Este arquivo permanece apenas como referência de transição e não contém mais o contrato executável.

## 2. Uso

- Invocar a skill para pesquisar e atualizar `docs/supa-up.md`, `docs/vercel-up.md`, `docs/github-up.md` e `docs/prod-up.md`.
- A skill conclui pesquisa, relatório, alteração, validação e draft PR de um catálogo antes de iniciar o seguinte.
- Consultar `docs/gestor-codex.md` para estado, valor e limites do recurso.

## 3. Validação e limites

- Validação estrutural da skill concluída em 22/07/2026.
- Primeira execução integral dos quatro catálogos permanece pendente de teste funcional.
- A execução é manual no Codex, não agendada, e nunca realiza merge.
