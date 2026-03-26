# automations/validador-final

Subprojeto isolado da automação **Validador Final**.

## Escopo atual

- valida briefing JSON do MVP 1
- executa tentativa real de login com Playwright
- publica resumo no `GITHUB_STEP_SUMMARY` quando executado em workflow

## Execução local

```bash
npm ci
npm run check
npm run start
```

## Briefing padrão

`automations/validador-final/templates/briefings/mvp1-login.json`

## Observação

Esta automação está isolada do Core do SaaS. Dependências de automação ficam dentro desta pasta.
