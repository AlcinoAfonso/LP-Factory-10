# Validacao operacional do Investigator

Esta pasta registra a Fase 5 do `agent-investigator`: validar se o pacote local esta coerente, instalavel como plugin repo-scoped e pronto para orientar investigacoes reais sem expor secrets.

## Como validar

Executar:

```bash
node plugins/agent-investigator/scripts/validate-operational.mjs
```

O validador confere:

- manifest do plugin e entrada no marketplace local;
- skill operacional e referencias canonicas;
- presets JSON, campos obrigatorios e IDs coerentes com filenames;
- escopos conhecidos de validacao;
- execucao de `list-presets.mjs` e `tool-readiness.mjs`;
- ausencia de nomes/paths legados nos arquivos canonicos.

## Escopos conhecidos

Os arquivos em `validation/scopes/*.json` sao fixtures de investigacao. Eles nao executam chamadas remotas; servem para validar que o agente tem contratos suficientes para receber escopos recorrentes e classificar evidencias, lacunas e bloqueios.

Para uma investigacao real, o operador deve fornecer o escopo no chat e permitir apenas as ferramentas/conectores necessarios.
