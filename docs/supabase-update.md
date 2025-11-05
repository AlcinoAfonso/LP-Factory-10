# Supabase Update 1.3 — LP Factory 10

> **Legendas**
> ✅ Implementado — ativo e funcional
> 🟧 Implementado parcialmente — em uso limitado ou fase inicial
> 🟦 Estável — disponível e maduro, ainda não implementado
> 🟣 Previsto — em rollout, preview ou indisponível (beta)

## 2025-08-01 — JWT Signing Keys
✅ Novo sistema de chaves assimétricas substitui o JWT Secret.  
Aplicado no Auth atual do LP Factory 10; garante rotação segura e menor latência sem desconectar usuários.

## 2025-08-05 — Security Controls Dashboard
🟦 Centraliza permissões e governança no painel Supabase.  
Melhora a administração de papéis e políticas; previsto para reforçar o Admin Dashboard.

## 2025-08-10 — Apache Iceberg Buckets
🟦 Suporte a análise de dados frios com formato Iceberg.  
Benefício potencial para relatórios históricos e planos Ultra.

## 2025-08-12 — FDWs (DuckDB / Iceberg)
🟦 Permite consultas diretas a dados externos (Data Lakes, BIs).  
Aplicação futura para Data Hub e integrações analíticas.

## 2025-08-15 — Unified Logs + AI Debugging
🟦 Painel unificado com assistente de logs via IA.  
Facilita depuração e identificação de falhas; substitui alertas manuais p95 no futuro.

## 2025-08-20 — Branching 2.0 (GitHub Opcional)
🟦 Criação e merge de branches direto no Dashboard Supabase.  
Reduz dependência do GitHub e simplifica DevOps visual.

## 2025-08-25 — Build via Figma + Supabase
🟦 Protótipos criados no Figma podem gerar apps Supabase.  
Acelerará a criação de templates e LPs com backend automático.

## 2025-08-30 — Storage 500 GB + Egress 3× Mais Barato
🟦 Ampliação de armazenamento e redução de custo de tráfego.  
Benefício direto para planos com uso de mídia e vídeos.

## 2025-09-01 — Edge Functions Persistent Storage
🟦 Permite arquivos persistentes dentro de funções edge.  
Pode otimizar geração de relatórios e automações locais no futuro.

## 2025-09-15 — Supabase Platform Kit (UI)
🟦 Kit oficial de componentes UI (Auth, Logs, Storage).  
Será adotado quando substituirmos o shadcn/ui no E10.

## 2025-09-20 — Stripe Sync Engine v2 (complementa versão anterior)
🟧 Integração Stripe-to-Postgres nativa.  
Automatiza planos e webhooks; ampliação futura (trials, descontos) prevista para Light/Pro.

## 2025-09-25 — Algolia Connector
🟦 Conector oficial para indexação full-text.  
Pode substituir adapter custom para busca global e ranking inteligente.

## 2025-09-30 — PostgREST 13
🟦 Recurso estável (GA) — já disponível.  
Versão atual no projeto: PostgREST 12.2.12 (Free Plan).

### Principais melhorias:
1. Spread to-many — relacionamentos 1‑N e N‑N retornam como arrays JSON, reduzindo código em adapters.  
2. Busca simplificada (textSearch) — dispensa colunas tsvector; exige índices GIN (to_tsvector('portuguese', coluna)).  
3. `maxAffected()` — limita atualizações em massa (tokens E7, convites E11).  
4. Headers de observabilidade — `Content-Length` e `Proxy-Status` ajudam a rastrear egress e erros PGRSTxxx.  
5. Segurança reforçada — validação de `kid` em JWT e verificação de schemas no `search_path`.

### Impacto para o LP Factory 10:
- Código mais limpo (menos boilerplate nos adapters)  
- Segurança aprimorada em mutações críticas  
- Monitoramento mais preciso via Logs Explorer  
- Sem efeito nas LPs estáticas (Vercel Edge)  
- Requer atualização `supabase-js` ≥ 2.56.0.

### Critérios para adoção:
1. E7 finalizado e ambiente estável.  
2. Backup manual confirmado.  
3. Teste em staging com smoke tests: login → reset → onboarding → Access Context.  
4. Atualizar `supabase-js`.  
5. Validar JWT/JWKS (`kid`).

### Próximos passos:
- Aguardar liberação total no painel (atualmente disponível apenas para novos projetos).  
- Solicitar early access via suporte se necessário.

## 2025-10-01 — Edge Functions Cache Layer (substitui Persistent Storage)
🟣 Cache com TTL e *event bust* integrado.  
Substitui storage persistente, otimizando *cold starts* e respostas rápidas.

## 2025-10-05 — Observabilidade com AI e Alertas Automáticos
🟦 Detecção automática de latência e falhas críticas.  
Ideal para monitorar Access Context e tokens E7 em produção.

## 2025-10-10 — Remote MCP Server (novo)
🟦 Permite conectar agentes de IA (Claude, GPT etc.) ao Supabase via servidor MCP remoto HTTP.  
Aplicação: automação de queries, geração de código e integração direta entre o LP Factory 10 e agentes de desenvolvimento IA.  
Valor: agrega automação e produtividade em fluxos de desenvolvimento e monitoramento.

## 2025-10-12 — Login com Solana e Ethereum (novo)
🟦 Supabase Auth agora suporta login Web3.  
Aplicação: relevante para clientes enterprise/white‑label com identidade descentralizada.  
Valor: amplia as opções de autenticação e integra o LP Factory 10 a ecossistemas Web3.

## 2025-10-14 — AI Reasoning no Dashboard (novo)
🟣 O Dashboard ganhou um módulo de raciocínio com IA para insights automáticos.  
Aplicação: complementa o item de Observabilidade com AI, oferecendo sugestões inteligentes e análise de métricas.  
Valor: reforça monitoramento preditivo e reduz necessidade de intervenção manual.

## Tracking e Analytics Interno (novo módulo)

### Objetivo
Criar tracking nativo de eventos nas LPs, medindo comportamento e conversão de forma anônima, segura e escalável, sem dependência de tags externas.

### Estrutura técnica
- Nova tabela `events_analytics` (`account_id`, `lp_id`, `event_type`, `ts`, `visitor_hash`, `utm_source`, `utm_campaign`, `utm_medium`).  
- Views agregadas (`vw_events_15m`, `vw_events_daily`) com RLS ativo.  
- `visitor_hash` gerado via `digest(ip || user_agent || salt_rotativo, 'sha256')`.  
- Retenção: eventos brutos 90 dias, agregados até 24 meses.  
2025-11-05 — Camada Inteligente de Remarketing (Experimental)

- Orquestração centralizada de pixels e parâmetros de remarketing em Supabase (Google Ads, Meta, RD Station etc.).
- Simplifica a gestão e o deploy de scripts, permitindo ativar, pausar ou testar variações sem tocar no front-end.
- Gera base para automações contextuais e coleta de dados unificada.

2025-11-05 — Integração HubSpot ↔ RD Station (Experimental)

- Ponte leve (Edge Function + cron jobs) para sincronizar leads, tags e status entre HubSpot e RD Station.
- Útil para agências que operam com múltiplos CRMs ou clientes em migração.
- Evita duplicidade e perda de dados, e permite segmentação unificada para automações.

- Integração futura com `audit_logs` e `leads`.

### Benefícios
- Reduz dependência de Google Tag/Meta Pixel.  
- Fornece métricas reais de conversão e engajamento diretamente no Dashboard.  
- Base para A/B tests, precificação por uso e relatórios de performance.  
- Mantém conformidade (sem PII, salt rotativo, RLS ativo).

### Status
🟣 Previsto (Preview/Beta)

## Resumo Geral

| Categoria | Recursos | Quantidade |
|---|---|---|
| ✅ | JWT Keys | 1 |
| 🟧 | Stripe Sync Engine v2 | 1 |
| 🟦 | 14 (Security Controls Dashboard, Iceberg, FDWs, Unified Logs + AI Debugging, Branching 2.0, Build via Figma + Supabase, Storage 500 GB + Egress 3×, Edge Functions Persistent Storage, Supabase Platform Kit, Algolia Connector, Observabilidade com AI + Alertas, Remote MCP Server, Login com Solana/Ethereum, PostgREST 13) | 14 |
| 🟣 | 3 (Edge Functions Cache Layer, AI Reasoning, Tracking e Analytics Interno) | 3 |

## Próximas Ações
1. Aguardar PostgREST 13 completo para projetos Free.  
2. Testar `supabase-js` 2.56.0 em *staging*.  
3. Criar índices GIN nas colunas de busca (`audit_logs`, `accounts`).  
4. Aplicar `.maxAffected(1)` em *mutations* críticas.  
5. Avaliar adoção do Platform Kit e novos recursos AI (Remote MCP, Reasoning).

**Última verificação:** 05/11/2025  
**Responsável técnico:** LP Factory 10 — Core DevOps  

