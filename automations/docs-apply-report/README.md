# automations/docs-apply-report

Automação isolada para aplicar reports JSON em documentos Markdown e abrir PR automático.

## Execução local

```bash
npm ci
npm run check
npm run start -- ../reports/arquivo.json
```

## Observação

- O workflow canônico permanece em `.github/workflows/pipeline-docs-apply-report.yml`.
- Esta pasta é a raiz de runtime da automação (não depende de scripts em `pipelines/`).
