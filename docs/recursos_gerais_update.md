# LP Factory 10 — Recursos Gerais Update

---

## 1 — Tradutor Unificado de Webhooks (LP → RD Station) *(🎧 Experimental)*
2025-11-12

### Descrição
Endpoint único recebe eventos canônicos das LPs, normaliza e encaminha ao RD Station por `routing_key`/`account_id`, com logs e retries.

### Valor para o Projeto
- Desacopla LPs de integrações; oferece observabilidade e retry centralizados.

### Valor para o Usuário / Negócio
- Integrações mais rápidas e confiáveis.

### Ações Recomendadas
1. Criar tabelas `rd_connectors` e `webhook_events`.
2. Subir `/api/webhooks/lp`; mapear `lead_created` como piloto.

---
