# Validador Final

## Objetivo desta pasta

Esta pasta concentra a estrutura base do caso `3.5 Validador Final`.

Neste momento, o escopo implementado é apenas o **item 5 do MR**:
- criar a estrutura base do pipeline
- validar o briefing JSON do MVP 1
- preparar o caminho para a implementação futura do executor real

## Estado atual

Implementado neste passo:
- workflow base em `.github/workflows/pipeline-validador-final.yml`
- runner base em `pipelines/validador-final/run.mjs`
- briefing modelo em `pipelines/validador-final/templates/briefings/mvp1-login.json`
- pasta de artifacts

Ainda não implementado neste passo:
- Playwright
- login real
- screenshot real
- resultado bruto do executor
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

* `Pipeline Validador Final`

Input disponível:

* `briefing_path`

Exemplo:

* `pipelines/validador-final/templates/briefings/mvp1-login.json`

## Próximo passo esperado

Próximo item do MR:

* implementar login real com Playwright
