# LP Factory 10 — Supabase Update  

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

## 22 — Remote MCP Server *(🟦 Estável)*  
2025-11-12  

### Descrição  
Permite conexão entre o Supabase e agentes IA (GPT, Claude, etc.) via servidor MCP HTTP.  

### Valor para o Projeto  
- Automatiza queries e tarefas de manutenção.  
- Integração direta com o ecossistema de agentes IA.  

### Valor para o Usuário  
- Funcionalidades de diagnóstico e suporte IA mais rápidas e inteligentes.  

### Ações Recomendadas  
1. Configurar endpoint remoto MCP no Supabase.  
2. Integrar com pipeline de observabilidade e logs.  

---

## 23 — AI Reasoning no Dashboard *(🟣 Previsto)*  
2025-11-12  

### Descrição  
Módulo IA que processa métricas do Supabase e gera insights automáticos de desempenho e uso.  

### Valor para o Projeto  
- Complementa Observabilidade IA com raciocínio contextual.  
- Reduz dependência de análises manuais.  

### Valor para o Usuário  
- Painel inteligente com alertas preditivos e recomendações.  

### Ações Recomendadas  
1. Integrar com dados do módulo Unified Logs.  
2. Ativar IA Debugging para coleta de contexto.  

---

## 24 — Tracking Interno de Eventos *(🟣 Previsto)*  
2025-11-12  

### Descrição  
Implementa tracking nativo de eventos no banco, substituindo dependência de ferramentas externas (Google Tag, Meta Pixel).  

### Valor para o Projeto  
- Coleta anônima e segura via Supabase (`events_analytics`).  
- Facilita relatórios e análises internas de conversão.  

### Valor para o Usuário  
- Métricas reais de engajamento e performance no dashboard.  

### Ações Recomendadas  
1. Implementar views agregadas (`vw_events_15m`, `vw_events_daily`).  
2. Conectar com server-side tracking da Vercel.  

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



