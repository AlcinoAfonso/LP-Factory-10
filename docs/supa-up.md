## # LP Factory 10 — Supabase Update  

---

## 1 — JWT Signing Keys *(✅ Implementado)*  

2025-08-01  

### Descrição  

Novo sistema de chaves assimétricas substitui o JWT Secret, garantindo rotação segura e menor latência sem desconectar usuários.  

### Valor para o Projeto  

- Melhora segurança e estabilidade da autenticação.  

- Compatível com PostgREST 13 e Supabase-js 2.56+.  

### Valor para o Usuário  

- Sessões mais seguras e contínuas.  

### Ações Recomendadas  

1. Validar chave no painel Supabase.  

2. Testar integração com SDK atualizado.  

---

## 2 — Security Controls Dashboard *(🟦 Estável)*  

2025-08-05  

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

### Descrição  

Novo kit oficial de componentes UI (Auth, Logs, Storage).  

### Valor para o Projeto  

- Substitui shadcn/ui.  

### Valor para o Usuário  

- Interface padronizada e profissional.  

### Ações Recomendadas  

1. Migrar componentes gradualmente.  

---

## 11 — Stripe Sync Engine v2 *(🟧 Parcial)*  

2025-09-20  

### Descrição  

Integração nativa entre Stripe e Postgres, automatizando planos e webhooks.  

### Valor para o Projeto  

- Simplifica Billing Engine (E9).  

### Valor para o Usuário  

- Atualizações de plano automáticas.  

### Ações Recomendadas  

1. Testar integração com Light/Pro.  

---

## 12 — Algolia Connector *(🟦 Estável)*  

2025-09-25  

### Descrição  

Conector para indexação full-text e busca inteligente.  

### Valor para o Projeto  

- Substitui adapters customizados.  

### Valor para o Usuário  

- Buscas mais rápidas e relevantes.  

### Ações Recomendadas  

1. Criar índices e validar ranking.  

---

22/12/2025 15:07 — Item 13 (PostgREST 13) no formato do print

## 13 — PostgREST 13 *(✅ Implementado)*

2025-12-22

### Descrição

Upgrade do PostgREST para v13 (Supabase Data API). Release incremental com ganhos concretos em consultas, segurança e observabilidade, sem mudar o modelo “Database as API”.

**Ganhos reais (v12.0.2 → v13.0.0):**

* **Spread `...` em relações to-many**: JSON mais simples, com arrays “flat” correlacionados no objeto pai.

* **FTS nativo em `text/json`**: filtros `fts/plfts/phfts/wfts` direto na coluna, com conversão automática para `tsvector`.

* **Modificadores `any/all`** em alguns operadores (ex.: `like(any)` / `like(all)`), reduzindo repetição de coluna em filtros.

* **JWT mais estrito**: se o JWT vier com `kid`, precisa existir chave correspondente no JWKS (senão 401).

* **Observabilidade melhor**: `Server-Timing` (quando habilitado), `Proxy-Status` em erros e logs mais ricos.

* **Erros mais explícitos**: `HTTP 416 / PGRST103` para range/paginação inválida; novos códigos PGRST em casos específicos.

**O que NÃO é ganho garantido do v13:**

* “Performance superior”/“menor latência” como regra geral.

* Mudança no modelo de RLS/multi-tenant (continua 100% Postgres/RLS).

* Mudança em CRUD/RPC básico (upgrade é transparente; novos recursos são opt-in).

### Valor para o Projeto

* Dashboards com relações (accounts → LPs → sections) ficam mais fáceis de montar com **spread `...`**, reduzindo transformação no frontend.

* Busca global/textual fica mais simples com **FTS direto em `text/json`**, sem exigir colunas/views `tsvector` dedicadas.

* Segurança mais robusta por padrão em cenários com JWT customizado (`kid`/JWKS).

* Debug mais rápido com headers/erros mais informativos (ex.: 416/PGRST103, Proxy-Status).

### Valor para o Usuário

* Listas/tabelas com dados relacionados mais consistentes e menos “quebras” de payload.

* Busca textual mais simples de evoluir e manter.

* Erros de paginação/consulta mais claros, reduzindo comportamentos silenciosos.

### Ações Recomendadas

1. Registrar evidência: confirmar no painel `Settings > Infrastructure` (PostgREST 13.x ativo).

2. Manter clientes atualizados: `supabase-js` ≥ 2.56 (e libs relacionadas).

3. Se usa JWT customizado/JWKS: validar chaves quando houver `kid` (sem chave correspondente deve falhar 401).

4. Adotar **spread `...`** nas listagens com relações to-many (usar alias para evitar chaves duplicadas).

5. Para busca: usar `fts/plfts/phfts/wfts` em colunas `text/json` quando fizer sentido; otimizar com índices no Postgres conforme necessidade.

6. Tratar `HTTP 416 / PGRST103` no frontend para UX amigável (quando offset/range for inválido).

7. (Opcional) Se disponível no ambiente: usar `Server-Timing`/`Proxy-Status` para diagnóstico de latência/erros em produção.

---

## 14 — Edge Functions Cache Layer *(🟣 Previsto)*  

2025-10-01  

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

### Descrição  

Conecta agentes IA (Claude, GPT) ao Supabase via servidor MCP remoto HTTP.  

### Valor para o Projeto  

- Facilita automação de queries e geração de código.  

### Valor para o Usuário  

- Acesso a diagnósticos e automações inteligentes.  

### Ações Recomendadas  

1. Integrar ao pipeline de debug IA.  

---

## 17 — Login com Solana e Ethereum *(🟦 Estável)*  

2025-10-12  

### Descrição  

Autenticação Web3 nativa para Supabase Auth.  

### Valor para o Projeto  

- Expande público enterprise e white-label.  

### Valor para o Usuário  

- Alternativas modernas de login.  

### Ações Recomendadas  

1. Validar para clientes enterprise.  

---

## 18 — AI Reasoning no Dashboard *(🟣 Previsto)*  

2025-10-14  

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

## 20 — Bundles de Grants por Plano *(✅ Implementado)*  

2025-11-12 

“Implementado conforme Base Técnica 1.7 — seção 4.11 (Sistema de Grants) e Roadmap E9.1 (Grants e Features).”

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

## 21 — Ajuste `security_invoker` nas Views *(🟩 Estável)*  

2025-11-12  

### Descrição  

Padronização das views do Supabase para uso de `security_invoker = true`, garantindo compatibilidade com PostgREST 13.  

### Valor para o Projeto  

- Reforça segurança e evita falhas de permissão.  

- Simplifica manutenção com controle centralizado.  

### Valor para o Usuário  

- Maior estabilidade e confiança no sistema.  

### Ações Recomendadas  

1. Atualizar views críticas (`v_user_accounts_list`, `v_access_context_v2`).  

2. Validar execução em ambiente staging antes do rollout.  

---

## 22 — Remote MCP Server *(DEPRECADO — duplicado)*  

Duplicado do item #16. Manter apenas #16 como fonte neste documento.

---

## 23 — AI Reasoning no Dashboard *(DEPRECADO — duplicado)*  

Duplicado do item #18. Manter apenas #18 como fonte neste documento.

---

## 24 — Tracking Interno de Eventos *(DEPRECADO — duplicado)*  

Corpo (curto): “Duplicado do item #19. Manter apenas #19 como fonte neste documento.

---

## 25  — Política de Dados: TTL Graduado (LGPD + Remarketing) 🟩 Estável)*

2025-11-12

### Descrição

Retenção por camadas: PII (30–90 dias), eventos brutos (180 dias) e agregados anônimos (18–24 meses), com salting rotativo e RLS.

### Valor para o Projeto

- Equilibra compliance e visão de longo prazo.

### Valor para o Usuário / Negócio

- Proteção de dados pessoais e métricas confiáveis.

### Ações Recomendadas

1. Criar/ajustar `visitor_identifiers`, `events_raw`, `metrics_daily`.

2. Configurar jobs de TTL e rotação de salts.

---

## 26 — Realtime Replay (Alpha) *(🧪 Experimental)*

2025-11-09  

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

## 31 — Security progress + roadmap 2026 *(🗾 Estável)*

2026-01-07

### Descrição  

Resumo das mudanças de segurança do Supabase em 2025 e das direções previstas para 2026 (algumas delas podem ser *breaking* dependendo do uso). O post oficial apresenta o retrospecto de segurança de 2025 e as metas para endurecer a plataforma em 2026.

### Valor para o Projeto  

- Reduz risco de drift: mudanças de segurança podem impactar Auth, Data API, chaves e secrets.  

### Valor para o Usuário  

- Menos instabilidade e menos retrabalho em hardening.

### Ações Recomendadas  

1. Ler o post de retro/roadmap e extrair itens que afetem Auth, API Keys, PostgREST/Data API, Vault/Secrets e padrões de segurança.  

2. Se houver item com potencial de quebra: abrir um caso dedicado (E16.xx/E9.xx conforme escopo).

---

## 32 — Stripe Sync Engine no Dashboard (1‑click) *(🗾 Estável)*

2025-12-19

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

### Descrição  

Recurso/integração do **index_advisor** para ajudar a identificar índices faltantes diretamente pelo Table Editor/Studio.

### Valor para o Projeto  

- Reduz tentativa‑e‑erro em performance (principalmente em listagens/views e queries pesadas).  

### Valor para o Usuário  

- Dashboards mais rápidos.

### Ações Recomendadas  

1. Adotar como checklist em incidentes de lentidão antes de mexer em arquitetura.

---

## 36 — Data API: PostgREST v14 (no projeto: 14.1) *(✅ Implementado no projeto)*

2025-12-11

### Descrição  

O Supabase Data API está em PostgREST **14.1** no ambiente do LP Factory 10 (registrado na Base Técnica).  

### Valor para o Projeto  

- Regras e compatibilidades já normatizadas na Base Técnica (3.12), incluindo: spread/alias em relações *to‑many*, FTS e interpretação de **HTTP 416 / PGRST103** como “fim da lista” (não erro).  

### Valor para o Usuário  

- Menos “engasgos” em endpoints REST/queries em momentos de pico.

### Ações Recomendadas  

1. Tratar a Base Técnica **3.12** como fonte de verdade operacional para PostgREST 14.1 (paginação, alias, FTS, índices).  

2. Remover a ideia de “rollout pendente” deste item (porque o ambiente atual já está em 14.1).  

---

## 37 — Geração de tipos Python via Supabase CLI *(🗾 Estável)*

2026-01-08

### Descrição  

Guia oficial para gerar **tipos Python** via CLI (`supabase gen types --lang=python`), com requisito de versão mínima e opção de geração local/remota.

### Valor para o Projeto  

- Útil se houver serviços auxiliares em Python (ex.: automações internas, jobs, scripts).  

### Valor para o Usuário  

- Menos bugs de contrato (type-safe) em integrações Python.

### Ações Recomendadas  

1. Registrar versão mínima e comando no doc (já descritos no guia).

---

## 38 — Quick announcements (Jan/2026) *(🗾 Estável)*

2026-01-08

### Descrição  

Pacote de anúncios rápidos do mês: quickstarts (Expo React Native, TanStack Start e Flask) e “Explain/Analyze diagrams” no Dashboard, entre outros.

### Valor para o Projeto  

- Referência rápida para não perder novidades menores que podem virar atalhos no futuro.  

### Valor para o Usuário  

- Evolução incremental sem surpresas.

### Ações Recomendadas  

1. Manter como log de rastreabilidade (sem obrigação de adoção imediata).

---

## 39 — pg_graphql desativado por padrão *(🗾 Estável)*

2026-02-15

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

### Descrição
O Supabase Studio passa a salvar **SQL snippets localmente**, permitindo versionamento e compartilhamento via Git pela pasta **`supabase/snippets`**.

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

## 44 — Query Ethereum directly from Postgres *(🗾 Estável)*

2026-02-05

### Descrição
Nova capacidade oficial para consultar dados Ethereum em tempo real diretamente do Postgres, via wrapper/integração suportada pela Supabase.

### Valor para o Projeto
- Amplia possibilidades de integração analítica e consultas externas.
- Mostra evolução da plataforma em wrappers e acesso a fontes especializadas.

### Valor para o Usuário
- Indireto no LP Factory 10; pode servir como referência de capacidade técnica da stack.

### Ações Recomendadas
1. Registrar como capacidade opcional da stack.
2. Não adotar agora no MVP.
3. Reavaliar apenas se surgir caso de uso real.

### Registro (Tipo B — Stack/Integração)
- Status: PENDENTE
- Verificado em: —
- Ambiente: Supabase / wrappers
- Evidência: —
- Observação: update oficial, mas sem prioridade prática imediata para o projeto.

---

## 45 — Supabase official Claude connector *(🗾 Estável)*

2026-02-05

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

### Descrição
A Supabase lançou **Logs Drains**, permitindo enviar logs de **Postgres, Auth, Storage, Edge Functions e Realtime** para destinos externos.

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

### Descrição
A Supabase atualizou a arquitetura do Storage, tornando a listagem de objetos significativamente mais rápida em bases muito grandes e corrigindo problemas de segurança relacionados ao gerenciamento de arquivos.

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
