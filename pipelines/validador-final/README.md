# Validador Final

## Objetivo desta pasta

Esta pasta concentra a estrutura do caso `3.5 Validador Final`.

Neste momento, o escopo implementado cobre os itens **5 e 6 do MR**:
- criar a estrutura base do pipeline
- validar o briefing JSON do MVP 1
- executar tentativa real de login com Playwright

## Estado atual

Implementado até este passo:
- workflow em `.github/workflows/pipeline-validador-final.yml` com gates de CI e execução do runner
- runner em `pipelines/validador-final/run.mjs` com validação do briefing e tentativa real de login
- executor Playwright em `pipelines/validador-final/login-playwright.mjs`
- briefing modelo em `pipelines/validador-final/templates/briefings/mvp1-login.json`
- pasta de artifacts

Ainda não implementado neste passo:
- item 7: validação oficial do critério de sucesso do login
- item 8: screenshot obrigatória
- item 9: saída final estruturada do MVP 1
- integração com OpenAI

## Briefing do MVP 1

O briefing deve seguir este contrato:

```json
{
  "environment": "preview | production",
  "app_url": "string",
  "login_email": "string",
  "login_password": "string",
  "expected_result_type": "url_contains | selector_visible",
  "expected_result_value": "string"
}
```

## Uso do workflow

Executar manualmente o workflow:

- `Pipeline Validador Final`

Input disponível:

- `briefing_path`

Exemplo:

- `pipelines/validador-final/templates/briefings/mvp1-login.json`

## Segurança de credenciais

- Não versionar credenciais reais no briefing.
- Quando necessário, usar `LOGIN_EMAIL_OVERRIDE` e `LOGIN_PASSWORD_OVERRIDE` no ambiente/secrets do workflow.
