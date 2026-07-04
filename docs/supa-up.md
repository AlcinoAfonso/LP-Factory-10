## # LP Factory 10 — Supabase Update  

---

## Convenção de status deste documento  

- O badge/título de cada item representa a maturidade/estado do recurso na plataforma Supabase, quando aplicável.
- Este documento não é histórico completo de updates da Supabase.
- O catálogo deve manter apenas recursos ainda aproveitáveis pelo LP Factory 10.
- Itens removidos por estarem globais, absorvidos, duplicados, deprecados ou superados não têm seus IDs reutilizados.

---

## Convenção de referência

O identificador canônico dos itens deste catálogo é `supa#n`.

Esse identificador deve ser usado no roadmap, Base Técnica, briefings, relatórios e referências cruzadas. A numeração não deve ser reutilizada após remoção, depreciação ou substituição de um item.

## Critério do catálogo ativo

Este documento deve manter apenas recursos Supabase que ainda possam ser aproveitados pelo Gestor de Updates em algum caso atual, futuro ou condicional.

Itens já implementados globalmente, absorvidos pela Base Técnica, superados, duplicados ou deprecados não permanecem no catálogo ativo.

Recursos pagos, enterprise ou futuros podem permanecer quando ainda tiverem aproveitamento possível em algum caso específico.

A rejeição ou adoção de cada recurso deve ser decidida caso a caso pelo Gestor de Updates, conforme o plano-base avaliado.

## 2 — Security Controls Dashboard *(🟦 Estável)*  

2025-08-05  

### Status no Projeto

- Status: Não implementado
- Evidência: docs/roadmap.md (sem caso/plano de adoção explícito no LP Factory 10)


### Descrição  

Novo painel de governança e permissões dentro do Supabase.  

### Valor para o Projeto  

- Centraliza papéis e políticas RLS.  

- Facilita controle administrativo.  

### Valor para o Usuário  

- Garantia de segurança e transparência.  

### Ações Recomendadas  

1. Revisar papéis e políticas.  

2. Integrar métricas de acesso no Admin Dashboard.  

---

## 3 — Apache Iceberg Buckets *(🟦 Estável)*  

2025-08-10  

### Status no Projeto

- Status: Não implementado
- Evidência: docs/roadmap.md (sem caso/plano de adoção explícito no LP Factory 10)


### Descrição  

Suporte a dados frios com formato Iceberg, ideal para análises históricas.  

### Valor para o Projeto  

- Aumenta flexibilidade analítica.  

### Valor para o Usuário  

- Relatórios mais amplos em planos Ultra.  

### Ações Recomendadas  

1. Avaliar custo-benefício em ambientes de produção.  

---

## 4 — FDWs (DuckDB / Iceberg) *(🟦 Estável)*  

2025-08-12  

### Status no Projeto

- Status: Não implementado
- Evidência: docs/roadmap.md (sem caso/plano de adoção explícito no LP Factory 10)


### Descrição  

Permite consultas diretas a fontes externas (Data Lakes e BIs).  

### Valor para o Projeto  

- Expande integração analítica.  

### Valor para o Usuário  

- Relatórios conectados a múltiplas origens.  

### Ações Recomendadas  

1. Mapear uso em Data Hub futuro.  

---

## 5 — Unified Logs + AI Debugging *(🟦 Estável)*  

2025-08-15  

### Status no Projeto

- Status: Em implementação por casos de uso
- Evidência: docs/roadmap.md (E5.4, E10.4.6) + docs/base-tecnica.md (logs estruturados com request_id/rid)


### Descrição  

Painel de logs unificado com suporte a depuração via IA.  

### Valor para o Projeto  

- Melhora diagnóstico e reduz tempo de correção.  

### Valor para o Usuário  

- Maior confiabilidade e tempo de resposta rápido.  

### Ações Recomendadas  

1. Habilitar IA Debugging.  

2. Integrar com Observabilidade.

### Registro (Tipo A — Plataforma)  

- Status: OK  

- Verificado em: 08/02/2026  

- Ambiente: Supabase Dashboard (projeto LP-Factory-10)  

- Evidência: Logs & Analytics → Logs Explorer; origem `auth_logs`; consulta padrão carregou; filtros de intervalo e busca “error” disponíveis.  

- Observação: correlação por `request_id` depende do Tipo B no E10.4.6 (logs estruturados).  

---

## 6 — Branching 2.0 *(🟦 Estável)*  

2025-08-20  

### Status no Projeto

- Status: Não implementado
- Evidência: docs/roadmap.md (sem adoção definida no escopo atual)
- Observação: Supabase Update May 2026 informa Branching without Git como default; manter sem adoção no MVP até existir baseline/staging claro.


### Descrição  

Criação e merge de branches diretamente no dashboard Supabase.  

### Valor para o Projeto  

- Diminui dependência de GitHub.  

- Simplifica DevOps visual.  

### Valor para o Usuário  

- Deploys mais ágeis.  

### Ações Recomendadas  

1. Testar merges em staging.  

---

## 7 — Build via Figma *(🟦 Estável)*  

2025-08-25  

### Status no Projeto

- Status: Não implementado
- Evidência: docs/roadmap.md (sem adoção definida no escopo atual)


### Descrição  

Protótipos criados no Figma geram apps Supabase automaticamente.  

### Valor para o Projeto  

- Acelera criação de templates e LPs.  

### Valor para o Usuário  

- Entregas mais rápidas e consistentes.  

### Ações Recomendadas  

1. Explorar uso no pipeline de design.  

---

## 8 — Storage 500 GB + Egress 3× Mais Barato *(🟦 Estável)*  

2025-08-30  

### Status no Projeto

- Status: Não implementado
- Evidência: docs/roadmap.md (sem adoção definida no escopo atual)


### Descrição  

Ampliação de armazenamento e redução de custo de tráfego.  

### Valor para o Projeto  

- Melhora escalabilidade e custo-benefício.  

### Valor para o Usuário  

- Mais conteúdo sem custo adicional.  

### Ações Recomendadas  

1. Avaliar planos para LPs com mídia.  

---

## 9 — Edge Functions Persistent Storage *(🟦 Estável)*  

2025-09-01  

### Status no Projeto

- Status: Não implementado
- Evidência: docs/roadmap.md (sem adoção definida no escopo atual)


### Descrição  

Permite arquivos persistentes dentro de funções edge.  

### Valor para o Projeto  

- Maior performance e cache local.  

### Valor para o Usuário  

- Respostas mais rápidas e estáveis.  

### Ações Recomendadas  

1. Implementar em relatórios e automações.  

---

## 10 — Supabase Platform Kit (UI) *(🟦 Estável)*  

2025-09-15  

### Status no Projeto

- Status: Não implementado
- Evidência: docs/roadmap.md (sem adoção definida no escopo atual)


### Descrição  

Novo kit oficial de componentes UI (Auth, Logs, Storage).  

### Valor para o Projeto  

- Substitui shadcn/ui.  

### Valor para o Usuário  

- Interface padronizada e profissional.  

### Ações Recomendadas  

1. Migrar componentes gradualmente.  

---

## 12 — Algolia Connector *(🟦 Estável)*  

2025-09-25  

### Status no Projeto

- Status: Não implementado
- Evidência: docs/roadmap.md (sem adoção definida no escopo atual)


### Descrição  

Conector para indexação full-text e busca inteligente.  

### Valor para o Projeto  

- Substitui adapters customizados.  

### Valor para o Usuário  

- Buscas mais rápidas e relevantes.  

### Ações Recomendadas  

1. Criar índices e validar ranking.  

---


## 14 — Edge Functions Cache Layer *(🟣 Previsto)*  

2025-10-01  

### Status no Projeto

- Status: Não implementado
- Evidência: docs/roadmap.md (sem adoção definida no escopo atual)


### Descrição  

Cache com TTL e *event bust* integrado.  

### Valor para o Projeto  

- Otimiza cold starts e performance edge.  

### Valor para o Usuário  

- LPs e APIs mais rápidas.  

### Ações Recomendadas  

1. Testar em staging.  

---

## 15 — Observabilidade com AI *(🟦 Estável)*  

2025-10-05  

### Status no Projeto

- Status: Não implementado
- Evidência: docs/roadmap.md (sem adoção definida no escopo atual)


### Descrição  

Monitoramento automático de latência e falhas críticas com IA.  

### Valor para o Projeto  

- Reduz tempo de reação a falhas.  

### Valor para o Usuário  

- Sistema mais confiável.  

### Ações Recomendadas  

1. Configurar alertas de p95/p99.  

---

## 16 — Remote MCP Server *(🟦 Estável)*  

2025-10-10  

### Status no Projeto

- Status: Não implementado
- Evidência: docs/roadmap.md (sem adoção definida no escopo atual)


### Descrição  

Conecta agentes IA (Claude, GPT) ao Supabase via servidor MCP remoto HTTP.  

### Valor para o Projeto  

- Facilita automação de queries e geração de código.  

### Valor para o Usuário  

- Acesso a diagnósticos e automações inteligentes.  

### Ações Recomendadas  

1. Integrar ao pipeline de debug IA.  

---

## 18 — AI Reasoning no Dashboard *(🟣 Previsto)*  

2025-10-14  

### Status no Projeto

- Status: Não implementado
- Evidência: docs/roadmap.md (sem adoção definida no escopo atual)


### Descrição  

Módulo de raciocínio com IA para insights automáticos.  

### Valor para o Projeto  

- Complementa Observabilidade IA.  

### Valor para o Usuário  

- Recomendações e diagnósticos proativos.  

### Ações Recomendadas  

1. Integrar métricas com observabilidade.  

---

## 19 — Tracking e Analytics Interno *(🟣 Previsto)*  

2025-10-20  

### Status no Projeto

- Status: Não implementado
- Evidência: docs/roadmap.md (sem adoção definida no escopo atual)


### Descrição  

Sistema de tracking nativo de eventos, medindo comportamento e conversão com segurança e LGPD.  

### Valor para o Projeto  

- Reduz dependência de Google Tag e Meta Pixel.  

### Valor para o Usuário  

- Métricas reais e confiáveis no Dashboard.  

### Ações Recomendadas  

1. Implementar `events_analytics`.  

2. Criar views agregadas para relatórios.  

---

## 20 — Bundles de Grants por Plano *(🟦 Estável)*  

2025-11-12 

### Status no Projeto

- Status: Em implementação por casos de uso
- Evidência: docs/roadmap.md (E9.4, E9.8; grants/model_grants/get_feature em evolução por casos)



### Descrição  

Modelo de controle dinâmico de recursos e permissões por plano, utilizando bundles configuráveis armazenados em `model_grants`.  

### Valor para o Projeto  

- Simplifica manutenção e pricing.  

- Elimina dependência de migrações para novos recursos.  

- Base técnica do Billing Engine (E9).  

### Valor para o Usuário  

- Flexibilidade para upgrades e personalização de planos.  

### Ações Recomendadas  

1. Criar tabela `model_grants` e função `get_feature()`.  

2. Integrar ao Admin Dashboard e Account Setup.  

---

## 26 — Realtime Replay (Alpha) *(🧪 Experimental)*

2025-11-09  

### Status no Projeto

- Status: Não implementado
- Evidência: docs/roadmap.md (sem adoção definida no escopo atual)


### Descrição

Permite que canais privados do Supabase Realtime recuperem mensagens anteriores, desde que tenham sido publicadas via *Broadcast From the Database*. Funciona como um histórico consultável de eventos Realtime.

### Valor para o Projeto

- Base técnica para colaboração em tempo real.  

- Possibilita recuperar logs temporários de ações no dashboard.  

- Útil para prototipação de edição colaborativa de LPs no futuro.

### Valor para o Usuário

- Visualização de eventos anteriores mesmo entrando depois no sistema.  

- Experiência contínua em funcionalidades colaborativas futuras.

### Ações Recomendadas

1. Aguardar estabilização do recurso (ainda em alpha).  

2. Testar integração com dashboards internos.  

3. Avaliar uso em módulos de logs e colaboração futura.

---

## 27 — Camada Inteligente de Remarketing *(🧪 Experimental)*

2025-11-10  

### Status no Projeto

- Status: Não implementado
- Evidência: docs/roadmap.md (sem adoção definida no escopo atual)


### Descrição

Centraliza, no Supabase, a configuração e ativação de scripts e parâmetros de remarketing (Google Ads, Meta Ads e RD Station). Substitui a necessidade de editar cada LP individualmente, usando tabelas e views para gerenciar pixels e eventos.

### Valor para o Projeto

- Orquestração única de pixels e UTM sem tocar no front-end.  

- Reduz risco de inconsistência entre LPs.  

- Cria base técnica para automações orientadas a eventos (A/B, campanhas dinâmicas).

### Valor para o Usuário

- Pixels sempre atualizados sem necessidade de suporte técnico.  

- Campanhas mais eficientes, com menor custo por lead.  

- Configurações por conta/LP unificadas, previsíveis e seguras.

### Ações Recomendadas

1. Criar tabela `remarketing_settings` (account_id, lp_id, provider, config_json).  

2. Criar função de leitura com fallback (lp → conta → default).  

3. Integrar leitura da camada a uma única função SSR na Vercel Edge.  

4. Mapear eventos do módulo `events_analytics` como gatilhos de remarketing.  

---

## 28 — Integração HubSpot ↔ RD Station *(🧪 Experimental)*

2025-11-10  

### Status no Projeto

- Status: Não implementado
- Evidência: docs/roadmap.md (sem adoção definida no escopo atual)


### Descrição

Fornece uma ponte leve, via Supabase Functions e Webhooks, para sincronização de leads, tags e eventos entre HubSpot e RD Station — útil para migração, operações híbridas ou para agências que atendem clientes que usam CRMs diferentes.

### Valor para o Projeto

- Centraliza tráfego de dados de CRM dentro da infraestrutura existente.  

- Reduz dependência de soluções externas (Zapier/Make).  

- Cria ativo técnico de automação entre plataformas de marketing.

### Valor para o Usuário

- Dados sempre sincronizados entre CRMs sem retrabalho manual.  

- Mais consistência em campanhas e funis híbridos.  

- Possibilidade de usar LP Factory como “hub de dados” da operação.

### Ações Recomendadas

1. Implementar webhook público (`/api/crm-sync`) com validação assíncrona.  

2. Criar tabela `crm_sync_queue` para armazenar eventos pendentes.  

3. Criar função cron (`supabase.functions.schedule`) para processar fila.  

4. Mapear campos padrão (nome, email, tags, origem, campanha).  

---

## 29 — Changelog Técnico Automatizável (Triggers & Policies) *(🧪 Experimental)*

2025-11-11  

### Status no Projeto

- Status: Não implementado
- Evidência: docs/roadmap.md (sem adoção definida no escopo atual)


### Descrição

Define um padrão unificado para rastrear mudanças em triggers, policies e funções do Supabase. Utiliza cabeçalhos YAML em migrations para permitir que uma Function ou GitHub Action gere automaticamente o changelog técnico a cada PR.

### Valor para o Projeto

- Rastreabilidade clara entre versões (ex.: v2.8 → v2.9).  

- Menos risco de drift entre schema, triggers e lógica do projeto.  

- Facilita QA, rollback e auditoria técnica.

### Valor para o Usuário

- Redução de erros em permissões, auditoria, convites e billing.  

- Menos instabilidade técnica ao ativar novas features.  

- Evolução previsível e documentada do backend.

### Ações Recomendadas

1. Padronizar migrations com cabeçalho YAML (`change_id`, `component`, `breaking`).  

2. Criar function `fn_changelog_collect()` para ler cabeçalhos.  

3. Gerar arquivo `docs/changelog-tecnico.md` automaticamente via GitHub Action.  

4. Adicionar validação obrigatória em PR (campo ausente → PR bloqueado).  

---

## 30 — Auth Email Templates (Templates de Email do Supabase Auth) *(🟩 Estável)*  

2025-12-01  

### Status no Projeto

- Status: Em implementação por casos de uso
- Evidência: docs/roadmap.md (E5.4, E5.6) + docs/base-tecnica.md (templates de Auth e SMTP via Resend)


### Descrição  

Permite editar, no Supabase Dashboard, os templates de emails transacionais do Auth (ex.: invite, reset password, confirmação de cadastro e alertas de segurança), usando variáveis padrão do Supabase para links e contexto.

### Valor para o Projeto  

- Padroniza comunicação de Auth sem criar infraestrutura de email própria.  

- Reduz tickets por confusão em convites, reset e onboarding.  

- Melhora segurança percebida com alertas (senha/email alterados, MFA etc).

### Valor para o Usuário  

- Emails mais claros, com branding e instruções objetivas.  

- Menos risco de erro ao aceitar convites ou redefinir acesso.

### Ações Recomendadas  

1. Supabase Dashboard > Authentication > Email Templates: revisar **Invite user** e **Reset password**.  

2. Criar copy PT-BR padrão (sem lógica condicional) e validar links/redirect em ambiente de preview.  

3. **Ao desenvolver o fluxo de convites (Fluxo 5/6), utilizar obrigatoriamente o template nativo de “Invite user” do Supabase**, evitando implementação de envio de email custom no Next.js.  

4. Ativar alertas de segurança (password/email changed, MFA) quando houver primeiros clientes.

---

## 32 — Stripe Sync Engine no Dashboard (1‑click) *(🗾 Estável)*

2025-12-19

### Status no Projeto

- Status: Não implementado
- Evidência: docs/roadmap.md (sem adoção definida no escopo atual)
- Observação: Supabase Update May 2026 informa que o Stripe Sync Engine passou a ser mantido pela Stripe e que o app Supabase no Stripe Marketplace está GA; manter sem adoção no E9 neste momento.


### Descrição  

Integração do Stripe Sync Engine diretamente no Supabase Dashboard (setup em um clique). Permite consultar **customers**, **subscriptions**, **invoices** e **payments** via SQL.

### Valor para o Projeto  

- Pode simplificar a camada de billing/assinaturas, reduzindo integração manual.  

### Valor para o Usuário  

- Menos falhas de sincronização; dados financeiros mais confiáveis no backoffice.

### Ações Recomendadas  

1. Decidir se essa integração vira caminho padrão do Billing Engine (para reduzir retrabalho).  

2. Se adotar: registrar quais tabelas/objetos do Sync Engine serão fonte de verdade para entitlement/grants.

---

## 33 — Metrics API: observabilidade via Prometheus *(🗾 Estável)*

2025-12-16

### Status no Projeto

- Status: Não implementado
- Evidência: docs/roadmap.md (sem adoção definida no escopo atual)


### Descrição  

Documentação aprimorada para exportar telemetria do banco (Metrics API) para stacks compatíveis com Prometheus.

### Valor para o Projeto  

- Caminho claro para monitorar a saúde/performance do Postgres/Supabase com ferramenta padrão de mercado.  

### Valor para o Usuário  

- Maior estabilidade percebida e menos indisponibilidades.

### Ações Recomendadas  

1. Decidir se entra no MVP (agora) ou se fica como setup recomendado após os primeiros clientes.

---

## 34 — ChatGPT Apps + mcp-use (MCP Servers em Edge Functions) *(🗾 Estável)*

2025-12-17

### Status no Projeto

- Status: Não implementado
- Evidência: docs/roadmap.md (sem adoção definida no escopo atual)


### Descrição  

Guia oficial da Supabase para criar apps do ChatGPT conectados ao banco usando **mcp-use**, facilitando o deploy de **MCP Servers** em **Supabase Edge Functions**.

### Valor para o Projeto  

- Opção concreta para “agentes com acesso a dados reais” usando a infraestrutura do Supabase.  

- Mantém a arquitetura de integração concentrada no stack já adotado.

### Valor para o Usuário  

- Suporte, diagnóstico e automação mais rápidos quando essa funcionalidade for exposta no produto.

### Ações Recomendadas  

1. Manter este update registrado no `docs/supa-up.md` como referência oficial da stack.  

2. Se um dia for adotado no produto, exigir RLS, escopo mínimo, auditoria e logs correlacionáveis.  

3. Não duplicar este conteúdo no `docs/auto-agentes-up.md`.

---

## 35 — Index Advisor no Table Editor *(🗾 Estável)*

2026-01-08

### Status no Projeto

- Status: Não implementado
- Evidência: docs/roadmap.md (sem adoção definida no escopo atual)


### Descrição  

Recurso/integração do **index_advisor** para ajudar a identificar índices faltantes diretamente pelo Table Editor/Studio.

### Valor para o Projeto  

- Reduz tentativa‑e‑erro em performance (principalmente em listagens/views e queries pesadas).  

### Valor para o Usuário  

- Dashboards mais rápidos.

### Ações Recomendadas  

1. Adotar como checklist em incidentes de lentidão antes de mexer em arquitetura.

---

## 37 — Geração de tipos Python via Supabase CLI *(🗾 Estável)*

2026-01-08

### Status no Projeto

- Status: Não implementado
- Evidência: docs/roadmap.md (sem adoção definida no escopo atual)


### Descrição  

Guia oficial para gerar **tipos Python** via CLI (`supabase gen types --lang=python`), com requisito de versão mínima e opção de geração local/remota.

### Valor para o Projeto  

- Útil se houver serviços auxiliares em Python (ex.: automações internas, jobs, scripts).  

### Valor para o Usuário  

- Menos bugs de contrato (type-safe) em integrações Python.

### Ações Recomendadas  

1. Registrar versão mínima e comando no doc (já descritos no guia).

---

## 39 — pg_graphql desativado por padrão *(🗾 Estável)*

2026-02-15

### Status no Projeto

- Status: Não implementado
- Evidência: docs/roadmap.md (sem caso de uso ativo para adoção no produto)


### Descrição
A extensão **pg_graphql** passa a vir **desativada por padrão** em novos projetos. Projetos existentes sem requisições GraphQL também podem ter a extensão desativada. Se você usa GraphQL, precisa **habilitar manualmente** a extensão no projeto.

### Valor para o Projeto

* Evita dependência implícita de GraphQL em ambientes novos.
* Reduz risco de drift entre projetos (novos vs antigos).
* Pode reduzir superfície de ataque quando GraphQL não é usado.

### Valor para o Usuário

* Menos risco de instabilidade por features não utilizadas.
* Experiência mais previsível em upgrades/criação de ambientes.

### Ações Recomendadas

1. Verificar se o projeto usa GraphQL (requisições / dependências).
2. Se usar: habilitar **pg_graphql** manualmente e registrar o motivo/escopo.
3. Se não usar: registrar explicitamente “GraphQL não utilizado” (governança).

### Registro (Tipo A — Plataforma)

* Status: PENDENTE
* Verificado em: —
* Ambiente: Supabase Dashboard (projeto LP-Factory-10)
* Evidência: —
* Observação: só é necessário habilitar se GraphQL for adotado.

---

## 40 — SQL snippets locais no Studio (pasta `supabase/snippets`) *(🗾 Estável)*

2026-02-10

### Status no Projeto

- Status: Em implementação por casos de uso
- Evidência: docs/lousa-estrategista-E10-5.md (E10.5.3 implementado com snippets do Grupo A; E10.5.4 planejado com snippets do Grupo C)


### Descrição
O Supabase Studio permite **criar e atualizar SQL snippets inline** e salvá-los localmente para versionamento e compartilhamento via Git pela pasta **`supabase/snippets`**.

### Valor para o Projeto

* Padroniza queries de QA/diagnóstico (RLS, perf, auditoria) como artefatos versionados.
* Reduz retrabalho (queries deixam de ficar “soltas” em chat).

### Valor para o Usuário

* Suporte/diagnóstico mais rápido em incidentes.
* Menos inconsistência em validações operacionais.

### Ações Recomendadas

1. Adotar a pasta `supabase/snippets` no repositório (com convenção de nomes).
2. Criar snippets mínimos para: checagens de RLS, smoke de onboarding, sanity checks do schema.
3. Incluir no checklist de QA quando aplicável.

---

## 41 — Supabase Assistant: sugestões de performance de queries *(🗾 Estável)*

2026-02-10

### Status no Projeto

- Status: Não implementado
- Evidência: docs/roadmap.md (sem adoção definida no escopo atual)


### Descrição
O Supabase Assistant passa a ajudar com **performance de queries**, oferecendo sugestões de otimização diretamente no Dashboard/Studio.

### Valor para o Projeto

* Acelera diagnóstico de lentidão sem inventar ferramentas externas.
* Complementa o uso de Index Advisor e boas práticas de índices/FTS.

### Valor para o Usuário

* Dashboards mais rápidos e estáveis.
* Menos degradação de UX em listas/relatórios.

### Ações Recomendadas

1. Usar como passo padrão quando houver suspeita de query lenta.
2. Registrar “antes/depois” (latência/planos) ao aplicar uma sugestão.
3. Priorizar índices/ajustes no Postgres quando a sugestão indicar gargalo estrutural.

### Registro (Tipo A — Plataforma)

* Status: PENDENTE
* Verificado em: —
* Ambiente: Supabase Dashboard (projeto LP-Factory-10)
* Evidência: —
* Observação: recurso de apoio (não muda runtime); adotar sob demanda.

---

## 42 — Edge Functions: upload de bundles via ZIP (drag-and-drop) *(🗾 Estável)*

2026-02-10

### Status no Projeto

- Status: Não implementado
- Evidência: docs/roadmap.md (sem adoção definida no escopo atual)


### Descrição
As Supabase Edge Functions passam a suportar **upload por drag-and-drop de arquivos ZIP**, permitindo mover bundles completos entre projetos.

### Valor para o Projeto

* Facilita migração/replicação de funções entre ambientes (staging/produção).
* Pode reduzir risco de drift quando funções forem usadas como integração/infra.

### Valor para o Usuário

* Correções e migrações mais rápidas com menor risco de indisponibilidade.

### Ações Recomendadas

1. Registrar como capacidade (sem adoção obrigatória agora).
2. Se/quando houver Edge Functions relevantes: definir padrão de empacotamento e checklist de migração.

### Registro (Tipo A — Plataforma)

* Status: PENDENTE
* Verificado em: —
* Ambiente: Supabase Dashboard (projeto LP-Factory-10)
* Evidência: —
* Observação: só vira valor quando Edge Functions forem parte do runtime do produto.

---

## 43 — Supabase PrivateLink (AWS) *(🗾 Estável)*

2026-02-10

### Status no Projeto

- Status: Não implementado
- Evidência: docs/roadmap.md (sem requisito formal de rede privada no plano atual)
- Observação: Deferido.


### Descrição
Permite conectar o banco Supabase a recursos na AWS por rede privada (sem exposição à internet pública), mantendo o tráfego dentro da infraestrutura AWS.

### Valor para o Projeto

* Opção de hardening para clientes enterprise/regulados.
* Pode reduzir requisitos de segurança que exigem tráfego privado.

### Valor para o Usuário

* Maior confiança/segurança em operações sensíveis.

### Ações Recomendadas

1. Registrar como opção “enterprise/futuro”, sem adoção no MVP.
2. Avaliar apenas quando houver requisito formal de cliente (segurança/rede).

### Registro (Tipo A — Plataforma)

* Status: DEFERIDO
* Verificado em: —
* Ambiente: —
* Evidência: —
* Observação: avaliar elegibilidade de plano/necessidade quando houver demanda.

---

## 45 — Supabase official Claude connector *(🗾 Estável)*

2026-02-05

### Status no Projeto

- Status: Não implementado
- Evidência: docs/roadmap.md (sem caso de uso ativo no produto)


### Descrição
A Supabase passou a oferecer integração oficial com o Claude, permitindo conectar projetos Supabase ao assistente para consultar e operar dados por instruções.

### Valor para o Projeto
- Abre caminho para fluxos assistidos por IA com dados reais.
- Pode acelerar diagnóstico e operações administrativas no futuro.

### Valor para o Usuário
- Indireto no MVP; potencial para suporte e automações mais rápidas no futuro.

### Ações Recomendadas
1. Registrar como integração oficial disponível.
2. Não adotar no MVP sem caso de uso claro.
3. Se um dia for adotado, exigir as mesmas travas de segurança já previstas no projeto.

### Registro (Tipo B — Integração)
- Status: PENDENTE
- Verificado em: —
- Ambiente: Supabase / Claude connector
- Evidência: —
- Observação: manter no radar, sem execução imediata.

---


## 46 — Logs Drains *(🗾 Estável)*

2026-03-05

### Status no Projeto

- Status: Não implementado
- Evidência: docs/base-tecnica.md + docs/roadmap.md (observabilidade atual coberta por logs estruturados; sem upgrade de plano)
- Observação: Não apto no plano atual.


### Descrição
A Supabase lançou **Logs Drains**, permitindo enviar logs de **Postgres, Auth, Storage, Edge Functions e Realtime** para destinos externos como **Datadog, Grafana Loki, Sentry, Axiom, S3** ou **endpoint próprio**.

### Valor para o Projeto
- Centraliza observabilidade fora do dashboard do Supabase.
- Facilita retenção, correlação e auditoria de incidentes.

### Valor para o Usuário
- Indireto: melhora a confiabilidade operacional e reduz tempo de investigação de falhas.

### Status no plano atual
- **Plano atual (Free): NÃO APTO**
- Motivo: este recurso foi lançado para **planos Pro**.

### Ações Recomendadas
1. Registrar como capacidade oficial da stack.
2. Não adotar agora no LP Factory 10 enquanto o projeto estiver no plano Free.
3. Reavaliar quando houver necessidade real de observabilidade centralizada e upgrade de plano.

### Registro (Tipo A — Plataforma)
- Status: NÃO APTO NO FREE
- Verificado em: —
- Ambiente: Supabase Dashboard / Logs Drains
- Evidência: —
- Observação: recurso oficial, mas indisponível no plano atual.

---

## 47 — Storage: performance and security overhaul *(🗾 Estável)*

2026-03-05

### Status no Projeto

- Status: Não implementado
- Evidência: docs/roadmap.md (sem adoção definida no escopo atual)


### Descrição
A Supabase atualizou a arquitetura do Storage com listagem de objetos até **14.8x** mais rápida em bases muito grandes, removendo a tabela **`prefixes`** e seus triggers associados, adotando **skip-scan** e **cursor-based pagination**, além de corrigir **path traversal** e prevenir **orphan objects** em deletes diretos por SQL.

### Valor para o Projeto
- Melhora a escalabilidade do Storage para cenários com muitos arquivos.
- Reduz risco de problemas de segurança no módulo de arquivos.

### Valor para o Usuário
- Uploads e listagens potencialmente mais rápidos.
- Maior confiabilidade no uso de arquivos.

### Ações Recomendadas
1. Registrar como melhoria oficial da stack.
2. Não abrir caso técnico só por isso agora.
3. Se o projeto passar a depender mais de Storage, usar este item como referência de capacidade já disponível.

### Registro (Tipo A — Plataforma)
- Status: PENDENTE
- Verificado em: —
- Ambiente: Supabase Storage
- Evidência: —
- Observação: melhoria de plataforma; não exige implementação imediata no projeto.

---

## 48 — Edge Functions dashboard for self-hosted and CLI *(🗾 Estável)*

2026-03-05

### Status no Projeto

- Status: Não implementado
- Evidência: docs/roadmap.md (sem adoção definida no escopo atual)


### Descrição
O dashboard de **Edge Functions** passou a funcionar também em ambientes **self-hosted** e **CLI**, permitindo listar, buscar, ver detalhes, testar e baixar funções como `.zip`.

### Valor para o Projeto
- Amplia o tooling operacional para Edge Functions.
- Pode facilitar inspeção e empacotamento de funções em fluxos mais avançados.

### Valor para o Usuário
- Indireto: mais agilidade operacional quando o projeto evoluir no uso de Edge Functions.

### Ações Recomendadas
1. Registrar como capacidade oficial da stack.
2. Não tratar como prioridade do MVP.
3. Reavaliar apenas se o uso de Edge Functions crescer no projeto.

### Registro (Tipo B — Tooling/Infra)
- Status: PENDENTE
- Verificado em: —
- Ambiente: Supabase Edge Functions / CLI
- Evidência: —
- Observação: manter no radar, sem execução imediata.

---

## 49 — Table Editor com filtros por IA *(🗾 Estável)*

2026-03-05

### Status no Projeto

- Status: Não implementado
- Evidência: docs/roadmap.md (sem adoção definida no escopo atual)

### Descrição
O Table Editor do Supabase passa a aceitar descrições em linguagem natural para montar filtros Postgres no dashboard.

### Valor para o Projeto
- Simplifica investigações operacionais e exploração assistida de dados no Studio.
- Pode reduzir atrito em consultas operacionais simples no dashboard.

### Valor para o Usuário
- Indireto: suporte e operação interna mais ágeis em análises exploratórias.

### Ações Recomendadas
1. Registrar como capacidade operacional do dashboard.
2. Não substituir SQL/manual técnico por esse recurso.
3. Reavaliar uso quando houver rotina operacional que se beneficie de filtros assistidos.

### Registro (Tipo A — Plataforma)
- Status: PENDENTE
- Verificado em: —
- Ambiente: Supabase Studio / Table Editor
- Evidência: —
- Observação: recurso de dashboard; não caracteriza implementação no produto.

---

## 50 — Read Replicas gerenciadas pela página de replicação *(🗾 Estável)*

2026-03-05

### Status no Projeto

- Status: Não implementado
- Evidência: docs/roadmap.md (sem adoção definida no escopo atual)


### Descrição
As Read Replicas passam a ser gerenciadas pela página oficial de Database Replication no dashboard do Supabase.

### Valor para o Projeto
- Registra uma capacidade futura relevante para escala de leitura e resiliência.
- Facilita governança operacional de replicação quando esse tipo de arquitetura for necessário.

### Valor para o Usuário
- Indireto: pode sustentar melhor performance e estabilidade em cenários futuros de maior carga.

### Ações Recomendadas
1. Registrar como capacidade oficial da stack para evolução futura.
2. Não adotar agora no MVP.
3. Reavaliar apenas se o projeto exigir escala de leitura e plano/infra compatíveis.

### Registro (Tipo A — Plataforma)
- Status: PENDENTE
- Verificado em: —
- Ambiente: Supabase Dashboard / Database Replication
- Evidência: —
- Observação: capacidade futura; não caracteriza implementação no projeto.

---

## 51 — `pg_trgm` para similaridade textual e autocomplete *(🗾 Estável)*

2026-04-03

### Status no Projeto

- Status: Em implementação por casos de uso
- Evidência: E10.5.6.1–E10.5.6.2 e `supabase/migrations/0009__e10_5_6_deterministic_taxon_matching.sql`.
- Observação: a migration cria a extensão `pg_trgm`, índices GIN de trigramas e usa similaridade textual no matching determinístico da taxonomia.

### Descrição

A extensão `pg_trgm` do PostgreSQL fornece operadores e índices para **similaridade textual por trigramas**, permitindo buscas aproximadas, tolerância a erro de digitação e suporte eficiente a `LIKE`/`ILIKE` com índice.

### Valor para o Projeto

- Potencializa matching entre texto livre e taxonomia canônica sem depender de IA no MVP.
- Ajuda em sugestão/autocomplete, aliases e tratamento de pequenas variações de escrita.
- Mantém baixo custo operacional por ficar dentro do Postgres.

### Valor para o Usuário

- Sugestões mais úteis enquanto digita.
- Menos erro de classificação por grafia imperfeita.
- Experiência mais fluida no onboarding e em fluxos de configuração.

### Ações Recomendadas

1. Considerar para a fase inicial do caso de taxonomia, junto com FTS.
2. Usar principalmente em sugestão/autocomplete e matching leve.
3. Evitar adoção ampla fora de casos com necessidade clara de busca aproximada.

### Registro (Tipo C — Infra/Schema/Contrato)

- Status: PENDENTE
- Verificado em: —
- Ambiente: PostgreSQL / Supabase
- Evidência: —
- Observação: recurso externo ainda não absorvido na base do projeto; documentado por potencial de ROI no caso de taxonomia.

---

## 52 — Generated columns para normalização e chaves derivadas *(🗾 Estável)*

2026-04-03

### Status no Projeto

- Status: Em implementação por casos de uso
- Evidência: docs/lousa-estrategista-E10-5.md (E10.5.2 implementado; `business_taxon_aliases.alias_text_normalized` aplicado como generated column)


### Descrição

Generated columns do PostgreSQL permitem manter **colunas derivadas automaticamente** a partir de outras colunas, úteis para normalização, slugs, versões simplificadas de texto e chaves auxiliares de busca.

### Valor para o Projeto

- Reduz retrabalho de normalização manual no código.
- Ajuda a manter consistência entre valor original e valor derivado.
- Facilita evolução futura da taxonomia com menos lógica espalhada.

### Valor para o Usuário

- Menos inconsistência em sugestões e classificações.
- Melhor previsibilidade em buscas e listas relacionadas a nichos.

### Ações Recomendadas

1. Considerar no desenho inicial da taxonomia para campos derivados de busca/normalização.
2. Usar apenas onde houver ganho claro de consistência.
3. Evitar excesso de colunas derivadas sem necessidade comprovada.

### Registro (Tipo C — Infra/Schema/Contrato)

- Status: PENDENTE
- Verificado em: —
- Ambiente: PostgreSQL / Supabase
- Evidência: —
- Observação: recurso externo ainda não absorvido na documentação do projeto; relevante para taxonomia, aliases e manutenção futura.

---

## 53 — `pgmq` para fila de revisão de ambiguidades *(🗾 Estável)*

2026-04-03

### Status no Projeto

- Status: Não implementado
- Evidência: não há adoção explícita de `pgmq` no projeto.
- Observação: recurso mais adequado para fase posterior do caso de taxonomia.

### Descrição

`pgmq` é uma fila leve baseada em Postgres, documentada pela Supabase, permitindo enfileirar eventos e mensagens sem dependência externa, com arquivamento e replay.

### Valor para o Projeto

- Pode suportar revisão futura de nichos ambíguos ou não classificados automaticamente.
- Cria base simples para esteira de revisão humana/assistida sem sair do Postgres.
- Mantém a arquitetura enxuta se o caso evoluir para curadoria operacional.

### Valor para o Usuário

- Indireto: melhora a qualidade futura das classificações e reduz inconsistências em casos ambíguos.

### Ações Recomendadas

1. Não adotar no MVP do caso de taxonomia.
2. Manter como recurso documentado para fase posterior.
3. Reavaliar quando houver volume real de ambiguidades ou necessidade de curadoria operacional.

### Registro (Tipo C — Infra/Schema/Contrato)

- Status: PENDENTE
- Verificado em: —
- Ambiente: Supabase / PostgreSQL
- Evidência: —
- Observação: recurso de fase posterior; não justifica abrir frente paralela agora.

---

## 54 — `pgvector` para similaridade semântica futura *(🗾 Estável)*

2026-04-03

### Status no Projeto

- Status: Não implementado
- Evidência: não há adoção explícita de `pgvector` no projeto atual.
- Observação: recurso para fase futura, não recomendado para o MVP deste caso.

### Descrição

`pgvector` permite armazenar embeddings e realizar **busca por similaridade vetorial/semântica** no Postgres, servindo de base para classificação assistida, busca semântica e fluxos de IA.

### Valor para o Projeto

- Cria caminho futuro para matching semântico mais sofisticado.
- Pode apoiar evolução para CRM, templates inteligentes e classificação assistida.
- Mantém a possibilidade de IA sobre a própria stack de dados do projeto.

### Valor para o Usuário

- Indireto no curto prazo; potencial de recomendações e classificações mais inteligentes no futuro.

### Ações Recomendadas

1. Não adotar agora no MVP deste caso.
2. Manter documentado como capacidade futura da stack.
3. Reavaliar apenas quando houver necessidade real de semântica/IA além de FTS + similaridade textual leve.

### Registro (Tipo C — Infra/Schema/Contrato)

- Status: PENDENTE
- Verificado em: —
- Ambiente: Supabase / PostgreSQL
- Evidência: —
- Observação: documentar como capacidade futura, sem induzir implementação imediata.

---

## 56 — Push Protection para `supabase_secret_key` *(🟦 Estável)*  

2026-04-20  

### Status no Projeto

- Status: Não implementado
- Evidência: não há registro no repositório de política operacional formalizada de push protection específica para `supabase_secret_key`


### Descrição  

Recurso de segurança/governança para bloquear push acidental de chaves secretas Supabase detectadas pelo GitHub (push protection para `supabase_secret_key`).  

### Valor para o Projeto  

- Reforça a política de não exposição de segredos e o uso controlado de `SUPABASE_SECRET_KEY`.  

- Reduz risco operacional de vazamento por erro humano em commits/pushes.  

### Valor para o Usuário  

- Maior proteção indireta de dados e continuidade do serviço.  

### Ações Recomendadas  

1. Habilitar/validar push protection no repositório GitHub do projeto.  

2. Revisar documentação interna de segredos para refletir o controle automático.  

3. Incluir checagem em onboarding técnico para reduzir recorrência de incidentes.  

### Registro (Tipo A — Plataforma)

- Status: PENDENTE
- Verificado em: —
- Ambiente: GitHub / Secret Scanning / Push Protection
- Evidência: —
- Observação: recurso de segurança e governança; reforça a política do projeto de uso controlado de `SUPABASE_SECRET_KEY` e prevenção de vazamento por push acidental.

---

## 57 — Schema Visualiser Improvements *(🟦 Estável)*  

2026-04-20  

### Status no Projeto

- Status: Não implementado
- Evidência: sem procedimento registrado no projeto para uso recorrente do visualizador como etapa de revisão de modelagem


### Descrição  

Melhorias do Schema Visualiser para inspeção de modelagem (relações clicáveis, ações de contexto em tabelas/colunas e navegação com popovers entre objetos conectados).  

### Valor para o Projeto  

- Apoia revisão operacional de modelagem em frentes de evolução de dados (ex.: E10.5 e Grupo C).  

- Complementa documentação técnica (`docs/schema.md`), sem substituí-la.  

### Valor para o Usuário  

- Melhora indireta na consistência estrutural das funcionalidades dependentes de dados.  

### Ações Recomendadas  

1. Adotar o visualizador como apoio em revisões de schema e PRs com migrations.  

2. Registrar no playbook quando usar inspeção visual versus revisão textual em `docs/schema.md`.  

### Registro (Tipo A — Plataforma)

- Status: PENDENTE
- Verificado em: —
- Ambiente: Supabase Studio / Schema Visualiser
- Evidência: —
- Observação: recurso de apoio operacional de modelagem e inspeção visual; complementa `docs/schema.md`, sem substituí-lo.

---

## 59 — Supabase Plugin para agentes (MCP + Agent Skills) *(🟦 Estável)*

2026-05-19

### Status no Projeto

- Status: Em implementação por casos de uso
- Evidência: `docs/gestor-codex.md` §§4–5: plugin em teste, leitura aprovada e escrita não aprovada.

### Descrição

Integração do Supabase com agentes por meio do plugin MCP e das Agent Skills, adotada gradualmente conforme casos de uso validados no projeto.

### Valor para o Projeto

- Pode acelerar investigações técnicas no Supabase e orientar agentes em tarefas relacionadas à plataforma.
- Permite avaliar a integração de forma incremental, sem antecipar adoção ampla.
- Mantém `docs/gestor-codex.md` como fonte dos detalhes operacionais, limites e estado dos testes.

### Valor para o Usuário

- Indireto: reduz atrito e risco técnico em entregas que dependem de Supabase.

### Ações Recomendadas

1. Adotar o plugin e as Agent Skills somente em casos de uso previamente delimitados.
2. Consultar `docs/gestor-codex.md` para regras operacionais, limites e estado de aprovação.
3. Não duplicar neste registro os detalhes operacionais mantidos no Gestor Codex.

### Registro (Tipo B — Tooling/Infra)

- Status: PENDENTE
- Verificado em: —
- Ambiente: Supabase Plugin MCP / Agent Skills / agentes de IA
- Evidência: `docs/gestor-codex.md` §§4–5.
- Observação: adoção gradual por casos de uso; governança operacional centralizada no Gestor Codex.

---

## 60 — Supabase Changelog com RSS, tags e feed Markdown *(🟦 Estável)*

2026-05-19

### Status no Projeto

- Status: Não implementado
- Evidência: Supabase Update May 2026; ainda sem rotina formal do Gestor de Updates baseada nesses feeds.

### Descrição

Melhorias no changelog da Supabase com RSS feeds, filtros por tag, feed `.md` e links para copiar entradas como Markdown ou perguntar ao ChatGPT/Claude.

### Valor para o Projeto

- Facilita monitoramento recorrente de updates Supabase.
- Reduz dependência de email manual.
- Pode apoiar o Gestor de Updates e futuras automações leves de acompanhamento.

### Valor para o Usuário

- Indireto: melhora governança técnica e reduz risco de perder mudanças relevantes da plataforma.

### Ações Recomendadas

1. Avaliar uso como fonte recorrente do Gestor de Updates.
2. Não automatizar decisões; usar como entrada de triagem.
3. Registrar updates relevantes no `docs/supa-up.md` apenas após avaliação humana.

### Registro (Tipo B — Tooling/Infra)

- Status: PENDENTE
- Verificado em: —
- Ambiente: Supabase Changelog / RSS / Markdown feed
- Evidência: —
- Observação: recurso para governança de updates, não feature do produto.

---

## 61 — Custom OAuth/OIDC providers for Auth *(🟦 Estável)*

2026-05-19

### Status no Projeto

- Status: Não implementado
- Evidência: docs/roadmap.md (sem caso de uso enterprise/IdP próprio no escopo atual)

### Descrição

Recurso de Auth para conectar provedores OAuth2 ou OpenID Connect próprios ao projeto Supabase, incluindo IdPs corporativos ou regionais compatíveis.

### Valor para o Projeto

- Pode apoiar cenários futuros enterprise, white-label ou clientes com IdP próprio.
- Não altera o fluxo MVP atual de login por email/senha.
- Não deve ser adotado sem caso comercial claro.

### Valor para o Usuário

- Futuro: permite login corporativo em clientes com infraestrutura própria de identidade.

### Ações Recomendadas

1. Não adotar no MVP.
2. Reavaliar apenas se surgir cliente com requisito formal de SSO/OIDC.
3. Se adotado no futuro, documentar impacto em Auth, RLS, roles e onboarding.

### Registro (Tipo A — Plataforma)

- Status: PENDENTE
- Verificado em: —
- Ambiente: Supabase Auth / OAuth / OIDC
- Evidência: —
- Observação: capacidade futura para cenários enterprise; sem prioridade no MVP.

---

## 62 — Supabase official ChatGPT app *(🟦 Estável)*

2026-06-10

### Status no Projeto

- Status: Não implementado
- Evidência: Supabase Update June 2026; sem adoção registrada no projeto.

### Descrição

Aplicativo oficial da Supabase para uso no ChatGPT, tratado como uma integração própria e separada do Codex Plugin.

### Valor para o Projeto

- Pode apoiar consultas e fluxos futuros da Supabase dentro do ChatGPT.
- Sua eventual adoção deve ser avaliada como integração independente.
- Não altera o estado, os limites ou as regras registrados em `docs/gestor-codex.md`.

### Valor para o Usuário

- Potencial futuro: acesso assistido a recursos da Supabase por meio do ChatGPT.

### Ações Recomendadas

1. Não implementar sem caso de uso aprovado.
2. Avaliar separadamente do Codex Plugin, sem transferir permissões ou decisões entre as integrações.
3. Se adotado, documentar escopo, permissões, riscos e validações em registro próprio, sem alterar `docs/gestor-codex.md` por consequência automática.

### Registro (Tipo B — Integração)

- Status: PENDENTE
- Verificado em: —
- Ambiente: Supabase official ChatGPT app
- Evidência: Supabase Update June 2026; sem adoção registrada no projeto.
- Observação: integração separada do Codex Plugin; não altera `docs/gestor-codex.md`.
