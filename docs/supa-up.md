## # LP Factory 10 — Supabase Update  

---

## Convenção de status deste documento  

- O badge/título de cada item continua representando a maturidade/estado do recurso na plataforma Supabase (mercado), quando aplicável.  
- Cada item ativo passa a ter também a seção **Status no Projeto** para representar exclusivamente o estado no LP Factory 10.  
- Valores aceitos em **Status no Projeto**: `Não implementado`, `Em implementação por casos de uso`, `Implementado globalmente no projeto`.  
- Observações operacionais curtas permitidas quando necessário: `Superado por item mais novo`, `Duplicado`, `Deferido`, `Não apto no plano atual`.  

---

## Convenção de referência

O identificador canônico dos itens deste catálogo é `supa#n`.

Esse identificador deve ser usado no roadmap, Base Técnica, briefings, relatórios e referências cruzadas. A numeração não deve ser reutilizada após remoção, depreciação ou substituição de um item.

## Regra de uso na primeira varredura

Na primeira varredura do Gestor de Updates, cada item deste catálogo deve ser filtrado antes de ser sugerido ao Estrategista.

Classificação operacional:

- **Fora da primeira varredura**: item já implementado globalmente no projeto ou já absorvido pela Base Técnica, schema, roadmap ou configuração operacional.
- **Elegível por caso**: item ainda não global, mas aplicável ao escopo específico da fase avaliada.
- **Rejeitar no MVP**: item pago, experimental, amplo demais, enterprise, sem caso real ou indutor de nova infra.
- **Não apto no plano atual**: item relevante, mas indisponível no plano Free/atual.
- **Monitorar**: item útil como radar técnico, sem recomendação de adoção.
- **Diferencial estratégico futuro**: item com valor comercial, técnico ou competitivo futuro, mas sem adoção no MVP.
- **Consolidado/deprecado**: item mantido apenas por histórico; não deve ser sugerido em avaliações novas.

Regra:
Itens com `Status no Projeto: Implementado globalmente no projeto` não devem ser listados como recursos preliminarmente elegíveis. Eles só devem aparecer no relatório quando forem necessários como regra normativa, evidência técnica ou trava de validação.

## 1 — JWT Signing Keys *(🟦 Estável)*  

2025-08-01  

### Status no Projeto

- Status: Implementado globalmente no projeto
- Evidência: docs/base-tecnica.md (JWT Signing Keys ativo; estado consolidado no ambiente)


### Filtro na primeira varredura

- Fora da primeira varredura como recurso candidato.
- Usar apenas como referência em casos de Auth, JWT, JWKS ou validação de tokens.


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
- Observação: Diferencial estratégico futuro; não implementar no MVP.


### Filtro na primeira varredura

- Diferencial estratégico futuro.
- Rejeitar no MVP.
- Elegível apenas se o caso envolver analytics avançado, BI, histórico de eventos, data lake ou cliente enterprise.


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
- Observação: Diferencial estratégico futuro com sensibilidade de segurança; não implementar no MVP.


### Filtro na primeira varredura

- Diferencial estratégico futuro.
- Rejeitar no MVP.
- Elegível apenas com caso concreto de integração externa de dados, BI ou analytics.
- Se adotado no futuro, exigir schema privado, controle de exposição, revisão de RLS e função segura quando aplicável.


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

## 11 — Stripe Sync Engine v2 *(🟧 Parcial)*  

2025-09-20  

### Status no Projeto

- Status: Não implementado
- Evidência: docs/roadmap.md (billing E9 não depende deste update específico)
- Observação: Superado por `supa#32`; manter apenas como histórico.


### Filtro na primeira varredura

- Consolidado/deprecado.
- Não sugerir em avaliações novas.
- Usar `supa#32` como item principal.


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

22/12/2025 15:07 — Item 13 (PostgREST 13) no formato do print

## 13 — PostgREST 13 *(🟦 Estável)*

2025-12-22

> Item histórico de referência; o estado atual do projeto está consolidado no item #36 (PostgREST 14.1).

### Status no Projeto

- Status: Não implementado
- Evidência: docs/base-tecnica.md (ambiente atual em PostgREST 14.1)
- Observação: Superado pelo item #36; ambiente atual do projeto em PostgREST 14.1.


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

## 17 — Login com Solana e Ethereum *(🟦 Estável)*  

2025-10-12  

### Status no Projeto

- Status: Não implementado
- Evidência: docs/roadmap.md (sem adoção definida no escopo atual)


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

## 21 — Ajuste `security_invoker` nas Views *(🟩 Estável)*  

2025-11-12  

### Status no Projeto

- Status: Implementado globalmente no projeto
- Evidência: docs/base-tecnica.md + docs/schema.md (views com security_invoker = true); sem seção E específica suficiente no roadmap para atribuição única.



### Filtro na primeira varredura

- Fora da primeira varredura como recurso candidato.
- Usar apenas como regra normativa quando a fase criar ou alterar views.
- Se o caso tocar views expostas, validar `security_invoker = true` conforme Base Técnica e schema.


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

### Filtro na primeira varredura

- Consolidado/deprecado.
- Não sugerir em avaliações novas.

---

## 23 — AI Reasoning no Dashboard *(DEPRECADO — duplicado)*  

Duplicado do item #18. Manter apenas #18 como fonte neste documento.

### Filtro na primeira varredura

- Consolidado/deprecado.
- Não sugerir em avaliações novas.

---

## 24 — Tracking Interno de Eventos *(DEPRECADO — duplicado)*  

Duplicado do item #19. Manter apenas #19 como fonte neste documento.

### Filtro na primeira varredura

- Consolidado/deprecado.
- Não sugerir em avaliações novas.

---

## 25  — Política de Dados: TTL Graduado (LGPD + Remarketing) 🟩 Estável)*

2025-11-12

### Status no Projeto

- Status: Não implementado
- Evidência: docs/roadmap.md (sem adoção definida no escopo atual)


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

## 31 — Security progress + roadmap 2026 *(🗾 Estável)*

2026-01-07

### Status no Projeto

- Status: Em implementação por casos de uso
- Evidência: docs/base-tecnica.md (guardrails de segurança já incorporados parcialmente; sem fechamento global)


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

### Status no Projeto

- Status: Não implementado
- Evidência: docs/roadmap.md (sem adoção definida no escopo atual)
- Observação: Supabase Update May 2026 informa que o Stripe Sync Engine passou a ser mantido pela Stripe e que o app Supabase no Stripe Marketplace está GA; manter sem adoção no E9 neste momento.


### Filtro na primeira varredura

- Rejeitar no MVP/E9 atual.
- Reavaliar apenas se houver decisão explícita de Billing Engine ou mudança formal do modelo de billing.
- Não substituir `public.account_commercial_entitlements` nem o fluxo de webhook/entitlements sem decisão humana.


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

## 36 — Data API: PostgREST v14 *(🟦 Estável)*

2025-12-11

### Status no Projeto

- Status: Implementado globalmente no projeto
- Evidência: docs/base-tecnica.md (ambiente atual PostgREST 14.1); docs/roadmap.md (E3.4 como update externo a considerar)
- Observação: uso específico de FTS no E10.5 ainda está previsto em docs/lousa-estrategista-E10-5.md (E10.5.6), não implementado.



### Filtro na primeira varredura

- Fora da primeira varredura como recurso candidato.
- Usar apenas como referência técnica quando o caso tocar Data API, paginação, FTS, alias/spread ou interpretação de erros PostgREST.


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

## 38 — Quick announcements (Jan/2026) *(🗾 Estável)*

2026-01-08

### Status no Projeto

- Status: Não implementado
- Evidência: docs/roadmap.md (registro informativo; sem adoção no escopo atual)


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

### Status no Projeto

- Status: Não implementado
- Evidência: docs/roadmap.md (sem caso de uso ativo para adoção no produto)


### Filtro na primeira varredura

- Rejeitar na primeira varredura salvo caso explícito de GraphQL.
- Se o caso não usar GraphQL, registrar apenas como trava de escopo: GraphQL não utilizado.
- Não sugerir como recurso novo.


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
- Observação: Diferencial estratégico futuro para enterprise/compliance; não implementar no MVP.


### Filtro na primeira varredura

- Diferencial estratégico futuro.
- Rejeitar no MVP.
- Elegível apenas com requisito formal de cliente enterprise, compliance ou rede privada.
- Não usar como propaganda principal para PME/MVP.


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

### Status no Projeto

- Status: Não implementado
- Evidência: docs/roadmap.md (sem caso de uso ativo no produto)


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


### Filtro na primeira varredura

- Não apto no plano atual.
- Rejeitar no MVP enquanto o projeto estiver no plano Free.
- Reavaliar apenas com upgrade de plano e necessidade real de observabilidade externa.


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
- Observação: Diferencial estratégico futuro de escala/performance; não implementar sem volume real.


### Filtro na primeira varredura

- Diferencial estratégico futuro.
- Rejeitar no MVP.
- Elegível apenas com tráfego real, dashboards pesados, latência global, carga de leitura relevante ou analytics em escala.


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

## 55 — GitHub Integration (Schema CI/CD) *(🟦 Estável)*  

2026-04-20  

### Status no Projeto

- Status: Implementado globalmente no projeto
- Evidência: fluxo próprio via `.github/workflows/pipeline-supabase-apply-migrations.yml` + `docs/base-tecnica.md` (migrations versionadas, Supabase CLI, `supabase link`, `supabase db push --linked` e gate operacional).
- Observação: a GitHub Integration nativa da Supabase não precisa ser adotada agora, pois o projeto já possui fluxo próprio de migrations versionadas com GitHub Actions + Supabase CLI.


### Filtro na primeira varredura

- Fora da primeira varredura como recurso candidato.
- Usar apenas como evidência de fluxo já existente quando o caso tocar migrations, baseline, CI/CD Supabase ou governança de schema.
- Não propor adoção da integração nativa da Supabase enquanto o fluxo atual atender ao MVP.


### Descrição  

Integração de governança e CI/CD de schema com GitHub no Supabase, permitindo sincronizar branches e aplicar migrations versionadas de `supabase/migrations`, além de apoiar deploy declarativo de recursos do projeto.  

### Valor para o Projeto  

- Reduz drift entre repositório e banco em fluxos com migrations versionadas.  

- Fortalece governança de mudanças de schema com checks de integração antes de merge.  

- Não resolve baseline sozinho; depende da organização prévia do diretório `supabase/`.  

### Valor para o Usuário  

- Menor risco de regressões silenciosas por divergência de schema em produção.  

### Ações Recomendadas  

1. Consolidar baseline do diretório `supabase/` (migrations, config e convenções).  

2. Conectar repositório ao projeto Supabase e configurar required checks no GitHub.  

3. Validar pipeline em branch de preview antes de ativação em produção.  

### Registro (Tipo A — Plataforma)

- Status: PENDENTE
- Verificado em: —
- Ambiente: Supabase Dashboard / GitHub Integration / Branching
- Evidência: —
- Observação: recurso de governança e CI/CD de schema; depende de baseline consolidado no diretório `supabase/` antes de adoção prática no projeto.

---

## 56 — Push Protection para `supabase_secret_key` *(🟦 Estável)*  

2026-04-20  

### Status no Projeto

- Status: Não implementado
- Evidência: não há registro no repositório de política operacional formalizada de push protection específica para `supabase_secret_key`


### Filtro na primeira varredura

- Elegível por caso apenas quando a fase tocar secrets, envs, service role, `supabase_secret_key`, webhooks ou automações com credenciais.
- Não duplicar governança de GitHub; referenciar `docs/github-up.md`.
- Se for confirmado que `github#3` cobre este caso de forma global, reclassificar em PR futuro como fora da primeira varredura.


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

## 58 — Data API: exposição explícita por GRANT para novas tabelas *(🟦 Estável)*

2026-05-19

### Status no Projeto

- Status: Implementado globalmente no projeto
- Evidência: docs/base-tecnica.md (regra incorporada em 3.8.1.5 para novas tabelas no schema public); e-mail da Supabase indica 1 projeto afetável por uso de Data API, sem indicação de erro atual.
- Observação: novos projetos adotam o comportamento em 30/05/2026; no projeto existente, novas tabelas passam a exigir `GRANT` explícito em 30/10/2026; tabelas existentes mantêm os grants atuais.

### Filtro na primeira varredura

- Fora da primeira varredura como recurso candidato.
- Usar apenas como regra normativa obrigatória quando a fase criar ou alterar tabela, view, RPC, policy ou migration exposta via Supabase Data API/PostgREST/GraphQL.
- Se houver nova tabela pública acessada pelo app, admin, adapters ou fluxo operacional, a avaliação deve exigir decisão explícita de GRANT, RLS e policies na mesma etapa.


### Descrição

A Supabase passou a mudar o comportamento de exposição automática de novas tabelas do schema `public` na Data API/PostgREST/GraphQL. Novas tabelas podem exigir `GRANT` explícito para ficarem acessíveis pela API, em vez de serem expostas automaticamente apenas por estarem no schema `public`.

### Valor para o Projeto

- Reduz risco de exposição acidental de tabelas novas.
- Obriga migrations futuras a declarar explicitamente quais roles podem acessar cada tabela via Data API.
- Evita drift entre tabela criada, RLS/policies configuradas e acesso real via `supabase-js`/PostgREST.
- Impacta diretamente novas tabelas em E10.5, E12, E19, billing, analytics, CRM e futuras automações.

### Valor para o Usuário

- Mais segurança indireta sobre dados e superfícies expostas.
- Menor risco de falhas silenciosas quando uma tabela existe no banco, mas não está acessível pela API por falta de grant explícito.

### Ações Recomendadas

1. Aplicar a regra da Base Técnica em toda nova migration que criar tabela no schema `public`.
2. Em toda tabela nova, separar claramente:
   - `GRANT`: define se a role pode acessar a tabela pela Data API.
   - RLS/policies: definem quais linhas podem ser acessadas.
3. Não conceder grants automaticamente para tabelas internas.
4. Antes de 30/10/2026, usar o Security Advisor para revisar quais tabelas estão expostas à Data API.
5. Quando a tabela precisar ser acessada por app, admin, adapters ou fluxo operacional via Supabase API, declarar os grants necessários na mesma migration da criação da tabela.

### Registro (Tipo C — Infra/Schema/Contrato)

- Status: ABSORVIDO NA BASE TÉCNICA
- Verificado em: —
- Ambiente: Supabase Data API / PostgREST / GraphQL / schema public
- Evidência: —
- Observação: mudança nasce na plataforma, mas a absorção no projeto é regra de migration, grants e contrato técnico.

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
