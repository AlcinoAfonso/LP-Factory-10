# automations/validador-final

Subprojeto isolado da automação **Validador Final**.

## Escopo atual

- valida briefing JSON do MVP 1
- executa tentativa real de login com Playwright
- valida resultado observado contra `expected_result_type` e `expected_result_value`
- marca status final como `passed` ou `failed`
- captura 1 screenshot obrigatória do estado final do login em `artifacts/login-final-state.png`
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
Na fase 1, `app_url`, `login_email` e `login_password` são informados manualmente em cada execução do workflow.
