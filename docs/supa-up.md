## # LP Factory 10 — Supabase Update  

---

## Convenção de status deste documento  

- O badge/título de cada item representa a maturidade/estado do recurso na plataforma Supabase, quando aplicável.
- Este documento não é histórico completo de updates da Supabase.
- O documento mantém o catálogo ativo e registros históricos compactos necessários à rastreabilidade do projeto.
- Todo ID publicado permanece localizável; IDs absorvidos, implementados, rejeitados, deprecados ou superados não são apagados nem reutilizados.

---

## Convenção de referência

O identificador canônico dos itens deste catálogo é `supa#n`.

Esse identificador deve ser usado no roadmap, Base Técnica, briefings, relatórios e referências cruzadas. A numeração não deve ser reutilizada após remoção, depreciação ou substituição de um item.

## Critério do catálogo ativo

Este documento deve manter apenas recursos Supabase que ainda possam ser aproveitados pelo Gestor de Updates em algum caso atual, futuro ou condicional.

Itens já implementados globalmente, absorvidos pela Base Técnica, superados, duplicados ou deprecados podem sair do catálogo ativo, mas permanecem como registro histórico com estado final, evidências, recortes e eventual substituto.

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


## 4 — FDWs / Wrappers para fontes externas (DuckDB / Iceberg / MongoDB) *(🟦 Estável; adoção condicional)*

2025-08-12  
Atualizado em 2026-07-13

### Status no Projeto

- Status: Não implementado — capacidade estratégica futura condicionada
- Evidência: `docs/roadmap.md` não possui integração externa aprovada; rodada Supabase Update July 2026 reconhece potencial competitivo futuro sem adoção no MVP
- Estado verificado: extensão `wrappers` não instalada no projeto Supabase

### Descrição

FDWs e Supabase Wrappers permitem consultar fontes externas a partir do Postgres sem exigir, em todos os casos, cópia integral ou sincronização permanente dos dados.

O Wrappers v0.6.2 acrescentou suporte a MongoDB, permitindo consultar e combinar coleções MongoDB com tabelas Postgres. DuckDB, Iceberg e MongoDB representam fontes possíveis; não são dependências atuais do LP Factory 10.

### Valor para o Projeto

- Preserva uma possibilidade competitiva de integrar catálogos, produtos, preços, disponibilidade, CRMs, data lakes ou bases mantidas por clientes e parceiros.
- Pode reduzir a necessidade de construir antecipadamente um pipeline ou conector completo para cada fonte.
- Mantém Supabase/Postgres como camada central em casos futuros de federação de dados.
- Pode acelerar onboarding e geração de LPs quando houver uma fonte externa real e recorrente.

### Valor para o Usuário

- Possibilidade futura de reutilizar dados já mantidos em outros sistemas.
- Menor duplicação e menor retrabalho de atualização em integrações adequadas a FDW.

### Limites no MVP

- Não instalar `wrappers` agora.
- Não contratar ou criar MongoDB, Data Lake ou Data Hub.
- Não criar foreign server, foreign table, secret, rota, job ou sincronização.
- Preferir API ou importação simples quando resolverem o caso com menor risco.
- Não usar FDW sem avaliar latência, disponibilidade, credenciais, rede, backup e dependência do terceiro.

### Gatilho futuro de avaliação

Avaliar implementação somente quando existir:

1. cliente ou caso aprovado com fonte externa real;
2. dado recorrente necessário para gerar ou operar landing pages;
3. vantagem comprovada sobre importação pontual ou API simples;
4. requisitos de segurança, disponibilidade e custo definidos.

### Ações Recomendadas

1. Manter como capacidade estratégica futura, sem implementação no MVP.
2. Reavaliar na primeira integração externa aprovada ou em eventual recorte de Data Hub.
3. Pesquisar novamente o wrapper e sua maturidade no momento do caso real.

---

## 5 — Unified Logs *(🧪 Open beta)*

2025-08-15  
Atualizado em 2026-08-03

### Status no Projeto

- Status: Em uso parcial — logs estruturados existem no runtime; disponibilidade e uso do Unified Logs ainda não foram validados no projeto.
- Evidência: `docs/base-tecnica.md` `5.3.3 exige logs estruturados com resultado, motivo seguro, `request_id` e latência; o registro anterior confirma uso do Logs Explorer clássico.
- Lacuna: confirmar no Dashboard se o rollout do Unified Logs já alcançou o projeto.

### Descrição

Unified Logs reúne, em uma única visão pesquisável, eventos do API Gateway, Postgres, Auth, Storage, PostgREST, Realtime e poolers. A open beta inclui filtros combináveis, busca, live tail, histograma por nível e detalhamento do percurso da requisição.

O recurso não deve ser descrito como AI Debugging e não substitui os logs estruturados do aplicativo nem Log Drains para retenção externa.

### Valor para o Projeto

- Reduz o tempo de correlação de incidentes entre serviços Supabase.
- Complementa o contrato atual de `request_id` sem criar nova infraestrutura.
- Pode facilitar smoke tests, deploys e investigação de falhas de Auth ou Data API.

### Valor para o Usuário

- Indireto: menor tempo de diagnóstico e maior previsibilidade operacional.

### Limites no MVP

- Open beta, sujeita a mudanças de interface e disponibilidade.
- Não criar destino externo, agente ou automação apenas por causa do recurso.
- Não registrar PII, secrets, tokens, prompts ou payloads brutos.

### Ações Recomendadas

1. Confirmar a disponibilidade no Dashboard na próxima investigação operacional.
2. Usar sob demanda, mantendo os logs estruturados do aplicativo como contrato principal.
3. Reavaliar Log Drains separadamente somente quando retenção externa for necessária.

### Fonte Oficial

- [Supabase Blog — Unified Logs is now in open beta](https://supabase.com/blog/unified-logs-open-beta)

### Registro (Tipo A — Plataforma)

- Status: NÃO VALIDADO NO PROJETO
- Verificado em: 2026-08-03
- Ambiente: Supabase Dashboard / Logs
- Evidência: fonte oficial e repositório no SHA inicial da rodada.
- Observação: o registro não autoriza nova infraestrutura.

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

## 7 — Build via Figma *(⚪ Registro histórico — não adotado)*

2025-08-25  
Reavaliado em 2026-08-04

### Estado e rastreabilidade

- Estado final: não implementado; retirado do catálogo ativo.
- Evidência: não há Figma Make nem geração de backend Supabase no repositório.
- Motivo: o item original não demonstrou superioridade sobre o repositório, o catálogo de módulos e o fluxo de design existentes.
- Preservação estratégica: ferramentas de design-to-code continuam avaliáveis no catálogo competente quando houver caso, sem reativar este ID por modernidade.
- Recortes aplicados: nenhum.
- O ID permanece histórico e não pode ser reutilizado.

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

## 10 — Supabase Platform Kit (UI) *(⚪ Registro histórico — não adotado)*

2025-09-15  
Reavaliado em 2026-08-04

### Estado e rastreabilidade

- Estado final: não implementado; retirado do catálogo ativo.
- Evidência: o projeto utiliza design system e shadcn/ui próprios e não oferece projetos Supabase aos seus usuários.
- Motivo: o Platform Kit não substitui o design system do produto e atende outro caso de plataforma.
- Recortes aplicados: nenhum.
- O ID permanece histórico e não pode ser reutilizado.

---

## 12 — Algolia Connector *(🟦 Estável; adoção condicional)*

2025-09-25  
Atualizado em 2026-08-03

### Status no Projeto

- Status: Não implementado.
- Evidência: não há Algolia, índice externo, credencial ou sync job no repositório.
- Relação com a stack: sobreposto à busca Postgres já apoiada por `pg_trgm`; não substitui o caminho atual sem prova de superioridade.

### Descrição

O conector oficial usa o Supabase como fonte de dados para sincronizar uma tabela ou view com um índice Algolia por tarefa periódica.

### Valor para o Projeto

- Pode oferecer ranking e busca externa quando a solução Postgres deixar de atender qualidade, volume ou latência.
- Preserva uma alternativa gerenciada sem antecipar adoção.

### Limites no MVP

- Exige serviço, credenciais, índice e sincronização externos.
- Introduz custo, consistência eventual, governança de campos e superfície adicional de segurança.
- Não adotar apenas por modernidade nem para substituir busca interna sem métrica.

### Gatilho futuro de avaliação

Avaliar somente quando houver busca de produto aprovada e:

1. qualidade ou latência do Postgres mensuravelmente insuficiente;
2. hipótese de superioridade do Algolia com critério de teste;
3. campos, frequência de sincronização, custo e proteção de dados definidos.

### Ações Recomendadas

1. Manter como alternativa condicional.
2. Comparar primeiro com FTS e `pg_trgm` no caso real.
3. Não criar índice, view, credencial ou job sem plano-base aprovado.

### Fonte Oficial

- [Supabase Blog — Algolia Connector for Supabase](https://supabase.com/blog/algolia-connector-for-supabase)

---

## 14 — Edge Functions Cache Layer *(⚪ Registro histórico — capacidade não validada)*

2025-10-01  
Reavaliado em 2026-08-04

### Estado e rastreabilidade

- Estado final: não validado como recurso oficial integrado com TTL e invalidação por evento.
- Evidência: a pesquisa oficial não confirmou a capacidade descrita no registro original; alternativas externas de cache não equivalem ao item.
- Recortes aplicados: nenhum.
- O ID permanece histórico e não autoriza criar cache ou infraestrutura.

---

## 15 — Observabilidade com AI *(⚪ Registro histórico — absorvido)*

2025-10-05  
Reavaliado em 2026-08-04

### Estado e rastreabilidade

- Estado final: absorvido por `supa#5` e `supa#41`.
- Evidência: Unified Logs e Supabase AI Assistant cobrem separadamente logs e assistência; não foi validado produto autônomo com o escopo original.
- Recortes aplicados: nenhum como recurso independente.
- O ID permanece histórico e não pode ser reutilizado.

---

## 16 — Remote MCP Server *(⚪ Registro histórico — absorvido)*

2025-10-10  
Reavaliado em 2026-08-04

### Estado e rastreabilidade

- Estado final: absorvido por `supa#59`.
- Evidência: a governança atual de MCP e Agent Skills está registrada no item substituto; o LPF Supabase Inspect MCP é serviço próprio e não prova adoção deste item original.
- Recortes relacionados: governança MCP em `docs/gestor-codex.md` e service de inspeção read-only.
- O ID permanece histórico e não pode ser reutilizado.

---

## 18 — AI Reasoning no Dashboard *(⚪ Registro histórico — absorvido)*

2025-10-14  
Reavaliado em 2026-08-04

### Estado e rastreabilidade

- Estado final: absorvido por `supa#41`.
- Evidência: o Supabase AI Assistant é a capacidade oficial identificada; não foi validado módulo separado com o escopo original.
- Recortes aplicados: nenhum como recurso independente.
- O ID permanece histórico e não pode ser reutilizado.

---

## 19 — Tracking e Analytics Interno *(🟨 Implementação parcial; transferido para produto)*

2025-10-20  
Reavaliado em 2026-08-04

### Estado e rastreabilidade

- Estado: tracking canônico implementado parcialmente; analytics interno agregado e automações não implementados.
- Evidência: a E10.6 registra `commercial_page_view`, `commercial_primary_cta_click` e `commercial_plan_cta_click`; não há `events_analytics` nem views agregadas.
- Relação atual: a evolução estratégica de microeventos, remarketing e follow-up permanece em `prod#15`; este item não é tratado como update oficial autônomo do Supabase.
- Horizonte: posterior ao Starter, a definir pelo Estrategista.
- O ID permanece como referência histórica do recorte parcial.

---

## 20 — Bundles de Grants por Plano *(🟨 Implementado parcialmente; arquitetura evoluída)*

2025-11-12  
Reavaliado em 2026-08-04

### Estado e rastreabilidade

- Estado: implementado parcialmente por casos de uso; o modelo comercial evoluiu para entitlements locais.
- Evidência: `docs/base-tecnica.md` mantém `get_feature(account_id, feature_key)`; E9 implementou `account_commercial_entitlements` e a view efetiva, sem confirmar a tabela `model_grants` proposta originalmente.
- Recortes: E9.4, E9.8 e evolução comercial da E9.
- Limite: não declarar implementação integral do desenho original nem criar `model_grants` por causa deste registro.
- O ID permanece rastreável para explicar a evolução de grants para entitlements.

---

## 25 — Política de Dados: TTL Graduado (LGPD + Remarketing) *(⚪ Registro histórico — proposta não implementada)*

2025-11-12  
Reavaliado em 2026-08-04

### Estado e rastreabilidade

- Estado: não implementado; retirado do catálogo ativo como proposta interna, não como rejeição definitiva do valor.
- Evidência: não há `visitor_identifiers`, `events_raw`, `metrics_daily`, jobs de TTL ou rotação de salts correspondentes.
- Horizonte: reavaliar apenas junto de tracking, consentimento, remarketing e requisitos reais de retenção.
- Limite: prazos de retenção dependem de finalidade, base legal e desenho aprovado; o registro não define política LGPD.
- O ID permanece histórico e não pode ser reutilizado.

---

## 26 — Realtime Replay (Alpha) *(🧪 Experimental)*

2025-11-09  
Atualizado em 2026-07-13

### Status no Projeto

- Status: Não implementado — capacidade futura condicionada a colaboração ou operação simultânea aprovada
- Evidência: `docs/roadmap.md` não possui adoção Realtime definida no escopo atual
- Estado verificado: publicação `supabase_realtime` existente, sem tabelas publicadas

### Descrição

Realtime Replay permite que canais privados recuperem mensagens anteriores publicadas via *Broadcast From the Database*.

**Nota complementar — Broadcast binário:** recurso distinto do Replay, disponível para transporte de payloads binários. Sua maturidade, compatibilidade de SDKs e aplicação devem ser verificadas separadamente se surgir caso real. O recurso não integra a adoção atual do `supa#26`.

### Valor para o Projeto

- Preserva opção futura para edição colaborativa, atualização simultânea de previews ou acompanhamento de operações.
- Pode permitir recuperação de eventos após entrada tardia ou reconexão.

### Valor para o Usuário

- Experiência futura mais contínua em funcionalidades colaborativas.
- Possibilidade de acompanhar alterações feitas por outros operadores ou usuários.

### Limites no MVP

- Não habilitar tabelas, canais, políticas ou novas dependências Realtime agora.
- Não criar histórico de eventos ou colaboração sem decisão de produto.
- Usar JSON para os fluxos atuais; não criar protocolo binário.
- Não tratar Replay como fila durável ou sistema de auditoria.

### Gatilho futuro de avaliação

Reavaliar apenas quando colaboração, preview simultâneo ou recuperação de eventos entrar formalmente no roadmap.

### Ações Recomendadas

1. Manter como capacidade futura, sem implementação.
2. Aguardar maturidade do Replay.
3. Quando houver caso aprovado para Replay, pesquisar novamente sua maturidade, consumo de mensagens e alternativas de sincronização.
4. Avaliar Broadcast binário separadamente apenas se surgir necessidade real de transporte binário.

---

## 27 — Camada Inteligente de Remarketing *(🟨 Registro estratégico transferido para produto)*

2025-11-10  
Reavaliado em 2026-08-04

### Estado e rastreabilidade

- Estado: não implementado; capacidade estratégica preservada em `prod#15`.
- Evidência: não há `remarketing_settings`, pixels centralizados, integração RD Station ou Meta correspondente.
- Horizonte: posterior ao tracking mínimo, potencialmente Lite/Pro, sujeito à decisão do Estrategista.
- Limite: não criar tabelas, scripts ou automações por causa deste registro.
- O ID permanece histórico para preservar a origem da proposta.

---

## 28 — Integração HubSpot ↔ RD Station *(⚪ Registro histórico — condicional)*

2025-11-10  
Reavaliado em 2026-08-04

### Estado e rastreabilidade

- Estado: não implementado; fora do catálogo ativo por não ser update oficial do Supabase.
- Evidência: não há HubSpot, RD Station, rota de sincronização ou fila correspondente no projeto.
- Preservação estratégica: integração com CRM pode ser reavaliada no catálogo de produto ou automações quando houver cliente e sistema-alvo reais.
- O ID permanece histórico e não pode ser reutilizado.

---

## 29 — Changelog Técnico Automatizável (Triggers & Policies) *(⚪ Registro histórico — não implementado)*

2025-11-11  
Reavaliado em 2026-08-04

### Estado e rastreabilidade

- Estado: desenho interno não implementado como descrito.
- Evidência: não há cabeçalhos YAML, função coletora nem changelog automatizado correspondente; migrations e Git já preservam rastreabilidade técnica por mecanismos próprios.
- Gatilho: reavaliar somente se auditoria de migrations demonstrar lacuna concreta.
- O ID permanece histórico e não autoriza workflow, função ou tabela.

---

## 30 — Auth Email Templates *(✅ Implementado em recortes)*

2025-12-01  
Atualizado em 2026-08-04

### Estado e rastreabilidade

- Estado: implementado no recorte de convites da E11; outros templates e alertas permanecem condicionais.
- Evidência: `docs/platform-config.md` registra o template nativo `Invite user` em português, transporte por `{{ .RedirectTo }}` e uso de `inviteUserByEmail`; as matrizes E11 e E11.2 registram o update como incorporado.
- Recortes: E11.1.7 e E11.2.
- Escopo remanescente: revisar reset de senha e alertas somente quando houver caso e validação próprios.
- Limite: preservar o envio nativo; o registro não autoriza e-mail customizado no Core.

### Fonte Oficial

- [Supabase Docs — Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)

---

## 32 — Stripe Sync Engine mantido pela Stripe *(🟦 Estável; adoção condicional)*

2025-12-19  
Atualizado em 2026-08-03

### Status no Projeto

- Status: Não implementado.
- Evidência: `docs/platform-config.md` registra checkout e webhook Stripe próprios, com entitlement local liberado somente pelo evento aprovado.
- Relação com a stack: complementar para reconciliação e analytics; sobreposto ao fluxo atual se usado para decidir entitlement.

### Descrição

O Stripe Sync Engine continua disponível pela integração do Dashboard Supabase e passou a ser mantido no repositório `stripe/sync-engine`. Ele replica objetos Stripe para um schema Postgres consultável por SQL.

### Valor para o Projeto

- Pode simplificar reconciliação financeira, backoffice e análises de MRR ou churn.
- Permite juntar dados Stripe e dados de aplicação quando houver necessidade operacional comprovada.

### Limites no MVP

- Não substituir o webhook atual nem transformar tabelas sincronizadas em fonte automática de entitlement.
- Introduz Edge Function, Cron, Queue, schema adicional, dados financeiros replicados e dependência operacional.
- Não instalar enquanto o fluxo atual atender checkout, webhook e entitlement com menor complexidade.

### Gatilho futuro de avaliação

Avaliar somente quando houver necessidade recorrente de reconciliação ou analytics que não seja atendida de forma simples pelo Stripe e pelo estado local, com hipótese mensurável de redução de falhas ou esforço.

### Ações Recomendadas

1. Manter como alternativa condicional.
2. Preservar o webhook aprovado como autoridade do fluxo atual.
3. Se o gatilho ocorrer, comparar custo, segurança, retenção e manutenção antes da adoção.

### Fonte Oficial

- [Supabase Blog — We’re Transferring the Stripe Sync Engine to Stripe](https://supabase.com/blog/stripe-sync-engine-transfer)

---

## 33 — Metrics API + Grafana Cloud *(🟦 Estável; adoção condicional)*

2025-12-16  
Atualizado em 2026-08-03

### Status no Projeto

- Status: Não implementado.
- Evidência: não há Grafana, credencial, dashboard ou integração registrada no repositório; a observabilidade atual usa logs estruturados e Supabase Dashboard.
- Relação com a stack: complementar, sem substituir logs do aplicativo ou Unified Logs.

### Descrição

A integração oficial cria, a partir do Dashboard Supabase, uma instância Grafana Cloud configurada com autenticação, scraping da Metrics API e dashboard com mais de 200 métricas de banco, pooler, disco, rede, checkpoints, tamanho e queries. A integração foi anunciada para todos os planos, inclusive Free.

### Valor para o Projeto

- Pode reduzir setup de métricas quando o banco entrar em operação comercial contínua.
- Ajuda a detectar pressão de CPU, memória, disco, conexões e replicação antes de incidentes.
- Evita construir dashboard próprio de infraestrutura.

### Valor para o Usuário

- Indireto: maior estabilidade e menor tempo de diagnóstico.

### Limites no MVP

- Cria dependência e conta em terceiro, com política própria de acesso, retenção e limites.
- A entrega atual cobre métricas; logs via Grafana não devem ser presumidos como disponíveis.
- Não configurar por antecipação sem rotina de monitoramento e responsável definidos.

### Gatilho futuro de avaliação

Avaliar quando houver primeiros clientes ativos, incidente recorrente ou necessidade de baseline operacional que justifique acompanhamento periódico de métricas.

### Ações Recomendadas

1. Manter como opção de observabilidade futura.
2. Priorizar o Dashboard e logs atuais enquanto atenderem o MVP.
3. Antes de conectar, definir responsáveis, acesso, retenção, custo e alertas mínimos.

### Fonte Oficial

- [Supabase Blog — Observability for every Supabase project with Grafana Cloud](https://supabase.com/blog/observability-for-every-supabase-project-with-grafana-cloud)

### Registro (Tipo B — Integração/Observabilidade)

- Status: PENDENTE
- Verificado em: 2026-08-03
- Ambiente futuro: Supabase Metrics API + Grafana Cloud
- Evidência: fonte oficial e ausência de integração no repositório.
- Observação: o registro não autoriza criar conta, credencial, dashboard ou alerta.

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

## 37 — Geração de tipos Python via Supabase CLI *(🟨 Futuro condicional)*

2026-01-08  
Reavaliado em 2026-08-04

### Estado e rastreabilidade

- Estado: não implementado; preservado como capacidade oficial condicional.
- Evidência: não há serviço Python aprovado no projeto; a stack atual é TypeScript.
- Horizonte: Pro/Ultra ou indefinido, apenas se surgir serviço Python real.
- Gatilho: adotar somente quando um serviço Python aprovado consumir o schema Supabase e tipos gerados reduzirem risco de contrato.
- Limite: não criar serviço, dependência ou pipeline Python por causa deste registro.

### Fonte Oficial

- [Supabase Docs — Generating Python Types](https://supabase.com/docs/guides/api/rest/generating-python-types)

---

## 39 — Retirada de `pg_graphql` não utilizado *(🟦 Estável; correção pendente)*

2026-02-15  
Atualizado em 2026-08-03

### Status no Projeto

- Status: Ausência de consumidor confirmada no repositório; retirada do ambiente ainda pendente.
- Evidência: busca no SHA inicial por `/graphql/v1`, `graphql_public`, `pg_graphql`, GraphiQL, Relay e codegen não encontrou consumidor de runtime; as ocorrências restantes estão no próprio catálogo, em configuração e inventário/baseline.
- Estado conhecido: o levantamento anterior encontrou `pg_graphql` 1.5.11 e `graphql_public.graphql` no projeto Supabase.
- Lacuna documental: a remoção deve ser executada em fase própria e depois refletida em `docs/schema.md` e `docs/platform-config.md`.

### Descrição

`pg_graphql` fornece a Data API GraphQL do Supabase. O projeto usa PostgREST/Data API REST e não possui consumidor GraphQL. A mudança de introspecção da versão 1.6.0 não cria motivo para manter a extensão.

### Valor para o Projeto

- Reduz superfície exposta e dependência sem uso.
- Evita drift entre configuração local, inventário e ambiente remoto.

### Limites desta rodada

- Não alterar banco, migration, schema, configuração ou runtime.
- Não considerar a extensão removida até apply e validação no ambiente alvo.
- Não reutilizar o ID após a retirada futura do catálogo.

### Ações Recomendadas

1. Tratar a retirada em recorte técnico próprio com nova migration versionada.
2. Revisar `supabase/config.toml`, inventário e documentação no mesmo recorte.
3. Após apply e validação, remover o item do catálogo ativo preservando a lacuna `supa#39`.

### Fontes Oficiais

- [Supabase Changelog — pg_graphql 1.6.0: introspection disabled by default](https://supabase.com/changelog)
- [Supabase Features — Auto-generated GraphQL API](https://supabase.com/features)

### Registro (Tipo A — Plataforma)

- Status: CORREÇÃO PENDENTE
- Verificado em: 2026-08-03
- Ambiente: repositório no SHA inicial + estado Supabase registrado na rodada anterior.
- Evidência: busca de uso concluída; mutação não autorizada neste workflow.
- Observação: a catalogação não implementa a retirada.

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

## 41 — Supabase AI Assistant *(🧪 Public alpha; uso assistivo)*

2026-02-10  
Atualizado em 2026-08-03

### Status no Projeto

- Status: Não implementado como dependência; uso operacional no Dashboard não validado.
- Evidência: não há integração, automação ou contrato de runtime dependente do Assistant no repositório.
- Relação com a stack: ferramenta de apoio no Dashboard; não integra o produto nem substitui revisão técnica.

### Descrição

O Supabase AI Assistant auxilia desenho de schema, escrita e depuração de SQL, análise de erros, descoberta de dados e sugestões para RLS, functions e triggers. A plataforma o classifica como public alpha.

### Valor para o Projeto

- Pode acelerar investigação e rascunhos técnicos no Dashboard.
- Consolida o valor anteriormente descrito de forma duplicada em observabilidade com IA, performance e “AI Reasoning”.

### Limites no MVP

- Sugestões não são autoridade e podem estar incorretas.
- Não executar SQL, alterar RLS, functions, triggers ou schema sem migration, revisão e validação.
- Não enviar PII, secrets ou payloads sensíveis.
- Não criar dependência de runtime.

### Ações Recomendadas

1. Usar somente como apoio sob demanda.
2. Revisar qualquer sugestão contra `docs/base-tecnica.md`, `docs/schema.md` e fontes oficiais.
3. Manter o fluxo versionado de migrations e merge humano.

### Fonte Oficial

- [Supabase Features — Supabase AI Assistant](https://supabase.com/features/ai-assistant)

### Registro (Tipo A — Plataforma)

- Status: PENDENTE
- Verificado em: 2026-08-03
- Ambiente: Supabase Dashboard
- Evidência: fonte oficial; uso no projeto não validado.
- Observação: ferramenta assistiva, sem autoridade de mudança.

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



## 46 — Logs Drains + Audit Log Drains *(🗾 Estável)*

2026-03-05  
Atualizado em 2026-07-13

### Status no Projeto

- Status: Não implementado — capacidade futura condicionada
- Evidência: `docs/base-tecnica.md` + `docs/roadmap.md` (observabilidade atual coberta por logs estruturados; sem upgrade de plano)
- Observação: não apto no plano atual

### Descrição

Logs Drains permitem enviar logs operacionais de Postgres, Auth, Storage, Edge Functions e Realtime para destinos externos.

Audit Log Drains, anunciado no Supabase Update July 2026, permite encaminhar Platform Audit Logs, que registram ações administrativas de membros da organização, como alterações de projeto, convites e configurações.

Logs operacionais e Platform Audit Logs são classes diferentes e não substituem os logs de negócio da aplicação.

### Valor para o Projeto

- Possibilita retenção externa, correlação e investigação de incidentes.
- Preserva opção futura para compliance, equipes maiores e separação de responsabilidades.
- Pode reduzir dependência do período de retenção do Dashboard quando houver necessidade comprovada.

### Valor para o Usuário

- Indireto: maior rastreabilidade e confiabilidade operacional em estágios futuros.

### Disponibilidade

- Logs Drains operacionais: planos Pro, Team e Enterprise.
- Platform Audit Logs / Audit Log Drains: planos Team e Enterprise.
- Plano atual registrado do LP Factory 10: Free, não apto.

### Limites no MVP

- Não fazer upgrade de plano somente por esse recurso.
- Não criar endpoint, bucket, Datadog, Loki, Sentry ou outro destino antecipadamente.
- Não confundir auditoria da plataforma com auditoria das ações de negócio dos usuários.

### Ações Recomendadas

1. Manter como capacidade futura.
2. Reavaliar quando houver upgrade de plano e necessidade real de retenção externa, compliance ou auditoria administrativa.
3. Definir destino, custo, segurança e retenção somente no caso aprovado.

### Registro (Tipo A — Plataforma)

- Status: NÃO APTO NO FREE
- Verificado em: 2026-07-13
- Ambiente: Supabase Dashboard / Logs Drains / Platform Audit Logs
- Evidência: documentação oficial da Supabase
- Observação: sem configuração imediata.

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
Atualizado em 2026-08-20  

### Status no Projeto

- Status: estado operacional não validado; não presumir que o controle esteja desativado.
- Evidência: não há registro no repositório de política operacional formalizada de push protection específica para `supabase_secret_key`; essa ausência comprova lacuna documental, não o estado efetivo do setting no GitHub.


### Descrição  

Recurso de segurança/governança para bloquear push acidental de chaves secretas Supabase detectadas pelo GitHub (push protection para `supabase_secret_key`).  

### Valor para o Projeto  

- Reforça a política de não exposição de segredos e o uso controlado de `SUPABASE_SECRET_KEY`.  

- Reduz risco operacional de vazamento por erro humano em commits/pushes.  

### Valor para o Usuário  

- Maior proteção indireta de dados e continuidade do serviço.  

### Ações Recomendadas  

1. Validar, em revisão operacional read-only, o estado efetivo do push protection no repositório e na conta, sem testar com credencial real.  

2. Se o controle já estiver ativo, registrar a evidência no documento operacional competente; se estiver desativado, submeter a mudança de setting a recorte próprio aprovado.  

3. Somente após a validação, refletir o controle no onboarding técnico e na documentação interna de segredos.  

### Registro (Tipo A — Plataforma)

- Status: VERIFICAÇÃO PENDENTE
- Verificado em: —
- Ambiente: GitHub / Secret Scanning / Push Protection
- Evidência: ausência de registro documental; estado do setting não inspecionado.
- Observação: a pendência é validar o controle global existente ou identificar necessidade de configuração; este registro não autoriza mudança de setting.

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
Atualizado em 2026-08-03

### Status no Projeto

- Status: Em implementação por casos de uso.
- Evidência: `docs/gestor-codex.md` ``4–5 registra plugin em teste, leitura aprovada e escrita não aprovada.
- Relação com a stack: tooling de desenvolvimento; não integra o runtime do SaaS.

### Descrição

O plugin reúne o MCP oficial e Agent Skills para agentes que trabalham com Supabase. O framework e benchmark oficial Supabase Evals, publicado em 31/07/2026, mede agentes em tarefas reais e reforça a necessidade de consultar documentação e skills atuais.

Supabase Evals não é uma dependência do projeto nem justifica criar suíte própria nesta fase; funciona como evidência externa para a governança de agentes já concentrada neste item.

### Valor para o Projeto

- Pode acelerar investigações técnicas e reduzir uso de conhecimento desatualizado.
- O benchmark oficial oferece referência para avaliar limites de agentes em schema, Auth, Edge Functions e RLS.
- Mantém a adoção incremental e controlada por caso de uso.

### Limites no MVP

- Manter leitura e escrita com permissões distintas.
- Não executar benchmark, containers, grader, MCP novo ou automação de eval sem caso aprovado.
- Resultado de benchmark não substitui validação do repositório e do ambiente alvo.

### Ações Recomendadas

1. Adotar plugin e skills somente nos casos delimitados em `docs/gestor-codex.md`.
2. Consultar fontes oficiais e validar qualquer mutação.
3. Usar Supabase Evals apenas como referência externa até existir necessidade concreta de avaliação própria.

### Fontes Oficiais

- [Supabase Blog — Introducing Supabase Evals](https://supabase.com/blog/introducing-supabase-evals)
- [Supabase Blog — AI Agents Know About Supabase](https://supabase.com/blog/supabase-agent-skills)

### Registro (Tipo B — Tooling/Infra)

- Status: PARCIAL
- Verificado em: 2026-08-03
- Ambiente: Supabase Plugin / MCP / Agent Skills / agentes
- Evidência: `docs/gestor-codex.md` e fontes oficiais.
- Observação: governança operacional permanece no Gestor Codex.

---

## 60 — Supabase Changelog com RSS, tags e feed Markdown *(🟦 Estável)*

2026-05-19
Atualizado em 2026-07-20

### Status no Projeto

- Status: Em uso manual como fonte oficial; feeds não automatizados
- Evidência: `docs/workflow-atualizacao-updates.md` formaliza a consulta de changelog, documentação e blog oficiais em cada rodada; não há consumidor RSS/Markdown nem automação desses feeds no repositório.

### Descrição

Melhorias no changelog da Supabase com RSS feeds, filtros por tag, feed `.md` e links para copiar entradas como Markdown ou perguntar ao ChatGPT/Claude.

### Valor para o Projeto

- Facilita monitoramento recorrente de updates Supabase.
- Reduz dependência de email manual.
- Pode apoiar o Gestor de Updates e futuras automações leves de acompanhamento.

### Valor para o Usuário

- Indireto: melhora governança técnica e reduz risco de perder mudanças relevantes da plataforma.

### Ações Recomendadas

1. Manter o changelog como fonte recorrente das rodadas do Gestor de Updates.
2. Não criar consumidor RSS/Markdown ou automatizar decisões sem caso aprovado.
3. Registrar no `docs/supa-up.md` somente updates com fonte oficial e valor concreto para o projeto.

### Registro (Tipo B — Tooling/Infra)

- Status: PARCIAL
- Verificado em: 2026-07-20
- Ambiente: Supabase Changelog / RSS / Markdown feed
- Evidência: `docs/workflow-atualizacao-updates.md` e Supabase Changelog oficial.
- Observação: a consulta manual está formalizada; RSS, feed Markdown e automação continuam não adotados. Recurso de governança de updates, não feature do produto.

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

## 62 — Supabase official ChatGPT app + Sign in with ChatGPT *(🧪 Integração em evolução)*

2026-06-10  
Atualizado em 2026-08-03

### Status no Projeto

- Status: Não adotado como integração operacional aprovada.
- Evidência: `docs/gestor-codex.md` governa o plugin Codex separadamente; não há registro de adoção da app oficial do ChatGPT.
- Relação com a stack: tooling operacional externo; não é método de login dos usuários do LP Factory.

### Descrição

A app oficial conecta projetos Supabase ao ChatGPT. Desde 29/07/2026, o Sign in with ChatGPT em beta reduz o atrito para entrar no Dashboard Supabase e autorizar o plugin no ChatGPT.

Login e consentimento são etapas separadas: o usuário ainda revisa o alcance concedido e pode revogar a conexão. O recurso não adiciona “Entrar com ChatGPT” ao Supabase Auth do produto.

### Valor para o Projeto

- Pode simplificar conexão operacional quando a app oficial entrar em caso de uso aprovado.
- Reduz confusão entre identidade de acesso ao Supabase e autorização do plugin.

### Limites no MVP

- Não transferir permissões, aprovação de escrita ou decisões do Codex Plugin para a app ChatGPT.
- Não tratar o beta como autenticação do produto.
- Não conceder escopo sem revisão e possibilidade de revogação.

### Ações Recomendadas

1. Manter como integração separada.
2. Avaliar somente com caso de uso e permissões definidos.
3. Se adotada, registrar escopo, consentimento, revogação e validação em documento operacional próprio.

### Fonte Oficial

- [Supabase Blog — Sign in with ChatGPT is in beta on Supabase](https://supabase.com/blog/sign-in-with-chatgpt-beta)

### Registro (Tipo B — Integração)

- Status: PENDENTE
- Verificado em: 2026-08-03
- Ambiente futuro: ChatGPT + Supabase
- Evidência: fonte oficial e ausência de adoção registrada.
- Observação: não altera o estado do plugin Codex.

---

## 63 — rlsautotest: geração de testes pgTAP para políticas RLS *(🧪 Beta comunitário)*

2026-07-09

### Status no Projeto

- Status: Não implementado — validação operacional futura
- Evidência: LP Factory 10 possui arquitetura multi-tenant, RLS, migrations versionadas e políticas sensíveis; não há adoção aprovada da ferramenta
- Estado verificado: extensão `pgtap` não instalada no projeto Supabase

### Descrição

`rlsautotest` é uma ferramenta comunitária destacada no Supabase Update July 2026. Ela inspeciona políticas RLS e gera dados seed, testes pgTAP e matrizes de acesso por tabela, comando e identidade.

A ferramenta ajuda a verificar o comportamento das políticas declaradas, mas não conhece a intenção humana e não substitui revisão de segurança.

### Valor para o Projeto

- Pode apoiar regressão de isolamento entre contas, usuários e papéis.
- Pode validar migrations que alterem tabelas ou policies sensíveis.
- Complementa revisão manual, Security Advisor e testes SQL específicos.
- Não altera o runtime do SaaS quando usada apenas em ambiente de teste.

### Valor para o Usuário

- Indireto: menor risco de exposição cruzada de dados em evoluções futuras.

### Limites no MVP

- Ferramenta comunitária, beta e versão 0.x.
- Nunca executar em produção.
- Usar somente banco local, temporário ou descartável.
- Teste verde comprova comportamento observado, não intenção correta da policy.
- Não instalar dependências Python no Core.
- Não criar workflow ou automação sem fase/caso aprovado.

### Ações Recomendadas

1. Manter como opção de validação para uma futura rodada ampla de RLS.
2. Se houver caso aprovado, executar primeiro uma prova isolada em banco descartável.
3. Avaliar custo de manutenção frente a testes pgTAP ou SQL escritos diretamente.
4. Não habilitar `pgtap` no projeto de produção apenas para experimentar a ferramenta.

### Registro (Tipo B — Tooling/Validação)

- Status: PENDENTE
- Verificado em: 2026-07-13
- Ambiente futuro: Supabase local ou banco descartável
- Evidência: repositório principal do projeto comunitário `unitautogen/rlsautotest` e destaque no Supabase Update July 2026
- Observação: item comunitário; não representa suporte oficial da Supabase.

---


## 64 — Supabase Pipelines para CDC analítico *(🧪 Public alpha; adoção condicional)*

2026-07-21

### Status no Projeto

- Status: Não implementado — capacidade futura condicionada a destino analítico aprovado
- Evidência: o LP Factory 10 usa Supabase Postgres como base transacional, mas não possui BigQuery, warehouse ou pipeline CDC aprovado no roadmap, na Base Técnica ou em `docs/services.md`

### Descrição

Supabase Pipelines é um serviço gerenciado de change data capture (CDC), apresentado oficialmente em dezembro de 2025 e disponibilizado em public alpha em 21/07/2026, que replica alterações do Postgres para destinos analíticos em quase tempo real. Na public alpha, BigQuery é o destino aberto a todos os planos pagos; ClickHouse, Snowflake e DuckLake dependem de acesso antecipado.

A entrega é ao menos uma vez, inclui cópia inicial, filtros por tabela, coluna ou linha, suporte a mudanças de schema selecionadas e monitoramento pelo Dashboard. Os dados são replicados sem transformação.

### Valor para o Projeto

- Pode isolar consultas analíticas pesadas do banco transacional quando volume e relatórios futuros justificarem um warehouse.
- Preserva uma alternativa gerenciada a exportações e pipelines CDC próprios.
- Pode apoiar analytics históricos ou planos superiores sem alterar a stack transacional do Core.
- Complementa o Supabase Postgres; não substitui agregações simples, exports pontuais nem a arquitetura atual.

### Valor para o Usuário

- Futuro e indireto: relatórios mais amplos sem transferir carga analítica pesada para o runtime transacional.

### Limites no MVP

- Não criar BigQuery, warehouse, replication slot, pipeline, credencial, job ou nova infraestrutura.
- Public alpha, somente em planos pagos e com cobrança por hora e por volume replicado.
- No destino BigQuery, cada tabela de origem precisa de chave primária incluída na publicação; colunas geradas não são suportadas e tipos customizados são replicados como texto.
- Entrega ao menos uma vez exige tratamento de duplicidade no destino.
- Replicação sem transformação não substitui modelagem, governança, LGPD, controle de acesso ou política de retenção.
- Avaliar carga no WAL, recuperação, mudanças de schema, exposição de dados, região e dependência do destino.
- Não usar para resolver analytics que continuem simples e seguros no Postgres.

### Gatilho futuro de avaliação

Avaliar somente quando houver:

1. destino analítico aprovado e responsável operacional definido;
2. volume ou consulta analítica que gere impacto mensurável no banco transacional;
3. vantagem comprovada sobre agregações internas, exportação pontual ou job simples;
4. custo, região, segurança, retenção, duplicidade e recuperação formalmente avaliados.

### Ações Recomendadas

1. Manter como opção futura e condicional.
2. Não implementar no MVP atual.
3. Reavaliar maturidade, destinos e preços quando surgir caso analítico real.
4. Comparar com alternativas mais simples antes de adotar.

### Fonte Oficial

- [Supabase Changelog — Public Alpha: Supabase Pipelines](https://supabase.com/changelog/48158-public-alpha-supabase-pipelines)
- [Supabase Blog — Introducing Supabase Pipelines](https://supabase.com/blog/introducing-supabase-pipelines)

### Registro (Tipo C — Infra/Dados)

- Status: PENDENTE
- Verificado em: 2026-07-22
- Ambiente futuro: Supabase Pipelines + destino analítico aprovado
- Evidência: changelog oficial de 21/07/2026, anúncio oficial de dezembro de 2025 e ausência de warehouse/CDC no repositório
- Observação: o registro não autoriza implementação, mudança de stack ou nova infraestrutura.

---

## 65 — Passkeys para Supabase Auth *(🧪 Beta; adoção condicional)*

2026-05-28  
Catalogado em 2026-08-03

### Status no Projeto

- Status: Não implementado.
- Evidência: o projeto usa email/senha, confirmação, recuperação e convite nativo; não há WebAuthn, passkey ou `navigator.credentials` no repositório.
- Natureza de uso: Auth do produto.
- Relação com a stack: complementar aos fluxos atuais, com possibilidade de reduzir dependência de senha; não substitui recuperação e convite sem desenho próprio.
- Horizonte: após estabilidade da beta e somente com necessidade de reduzir atrito ou phishing no login.

### Descrição

Passkeys são credenciais WebAuthn resistentes a phishing. O usuário autentica com biometria, PIN do dispositivo ou chave física; o Supabase guarda a chave pública e o material privado permanece no autenticador do usuário.

### Valor para o Projeto

- Pode reduzir atrito de login e risco de phishing.
- Mantém Auth dentro da stack Supabase.
- Pode melhorar a experiência de contas recorrentes quando o fluxo atual estiver validado comercialmente.

### Gatilho futuro de avaliação

Avaliar somente quando houver:

1. métrica ou feedback real de atrito, abandono ou recuperação de senha;
2. beta suficientemente madura para o risco do produto;
3. desenho de enrollment, fallback, recuperação, convite e suporte entre dispositivos;
4. comparação objetiva com manter email/senha, magic link ou MFA.

### Dependências, riscos e limite

- Compatibilidade de navegador, dispositivo e sincronização de credenciais.
- Exige UI e testes de enrollment, login, exclusão e recuperação.
- Não remover o fallback atual sem prova de cobertura.
- Não implementar nesta rodada.

### Fonte Oficial

- [Supabase Changelog — Passkeys for Supabase Auth (Beta)](https://supabase.com/changelog/46458-passkeys-for-supabase-auth-beta)

### Registro (Tipo A — Auth)

- Status: PENDENTE
- Verificado em: 2026-08-03
- Ambiente futuro: Supabase Auth + browsers WebAuthn
- Evidência: fonte oficial e ausência no repositório.
- Observação: o registro não autoriza implementação.

---

## 66 — Searchable field-level encryption com CipherStash *(🟦 Disponível; adoção condicional)*

2026-07-09  
Catalogado em 2026-08-03

### Status no Projeto

- Status: Não implementado.
- Evidência: não há CipherStash, ZeroKMS, SDK wrapper, proxy ou credencial relacionada no repositório.
- Natureza de uso: segurança complementar para campos sensíveis pesquisáveis.
- Relação com a stack: complementar a Supabase/Postgres e RLS; não substitui RLS, grants, criptografia em trânsito, minimização de dados ou LGPD.
- Horizonte: somente diante de requisito regulatório ou contratual concreto.

### Descrição

A integração aplica criptografia no nível da aplicação e permite buscas, filtros e joins sobre metadados criptográficos, mantendo as chaves sob controle externo por ZeroKMS. É uma integração de terceiro apresentada oficialmente pela Supabase.

### Valor para o Projeto

- Pode reduzir exposição de plaintext em campos selecionados quando um cliente ou vertical exigir proteção além da stack padrão.
- Preserva capacidade de consulta em casos em que criptografia tradicional inviabilizaria busca.

### Gatilho futuro de avaliação

Avaliar somente quando houver:

1. dado e ameaça claramente identificados;
2. obrigação regulatória, contratual ou de segurança que RLS e controles atuais não atendam;
3. necessidade comprovada de pesquisar ou relacionar o campo cifrado;
4. comparação com minimização, tokenização, criptografia simples ou não armazenar o dado.

### Dependências, riscos e limite

- Novo fornecedor, SDK/proxy, gestão de chaves, disponibilidade, região, custo e lock-in.
- Exige revisão de backup, recuperação, rotação, observabilidade e acesso administrativo.
- Não adotar como selo genérico de segurança nem sem responsável operacional.
- Não criar schema, chave, credencial ou integração nesta rodada.

### Fonte Oficial

- [Supabase Blog — Searchable field-level encryption with CipherStash](https://supabase.com/blog/searchable-field-level-encryption-with-cipherstash)

### Registro (Tipo B — Integração/Security)

- Status: PENDENTE
- Verificado em: 2026-08-03
- Ambiente futuro: aplicação TypeScript + Supabase + CipherStash
- Evidência: fonte oficial e ausência no repositório.
- Observação: o registro não autoriza implementação ou contratação.

---

## 67 — Depreciação de version pinning em extensões *(🟦 Mudança operacional)*

2026-07-22  
Catalogado em 2026-08-04  
Atualizado em 2026-08-20

### Status no Projeto

- Status: compatibilidade atual validada; nenhuma alteração técnica necessária.
- Evidência: revisão read-only dos 48 arquivos SQL em `supabase/migrations/` e `supabase/legacy-migrations/` no HEAD `e818887ad3e35cb8e182bb2537b8e689af0caa4b`. Há somente duas instruções `create extension`, ambas para `pg_trgm` sem cláusula de versão, e nenhuma instrução `alter extension ... update` com versão explícita.
- Relação com a stack: o estado versionado atual não depende de pinning de extensão; a regra permanece preventiva para migrations futuras.
- Horizonte: atual, como regra global de revisão técnica quando houver criação ou atualização de extensões.

### Valor para o Projeto

- Confirma que as migrations existentes não dependem de comportamento já ignorado pela plataforma.
- Evita que novas migrations pareçam instalar uma versão específica quando a versão default for usada.

### Ações Recomendadas

1. Em novas migrations, não depender de version pinning para extensões hospedadas.
2. Se um recorte futuro alterar extensões, verificar a versão default efetiva da plataforma em vez de presumir uma versão pelo SQL.
3. Absorver a regra preventiva no documento técnico competente antes de retirar este item do catálogo ativo.

### Critério de encerramento

- Registrar canonicamente a regra para migrations futuras; depois disso, preservar este ID como histórico compacto de compatibilidade validada.

### Limites

- Extensões já instaladas não são alteradas pelo anúncio.
- Não executar `alter extension`, migration ou mudança de ambiente em consequência deste registro.
- Self-hosted não é afetado segundo a fonte oficial.

### Fonte Oficial

- [Supabase Changelog — Extension version pinning is deprecated](https://supabase.com/changelog/extension-version-pinning-ignored)

---
## 68 — Postgres Changes com filtros compostos e seleção de colunas *(🟦 Disponível; adoção condicional)*

2026-08-05
Catalogado em 2026-08-10

### Status no Projeto

- Status: não implementado; capacidade futura condicionada a um caso real de atualização em tempo real.
- Evidência: não há assinatura `postgres_changes`, `channel()` ou publicação de tabela para Realtime no código; `package-lock.json` resolve `@supabase/supabase-js` em `2.89.0`.
- Natureza de uso: redução de eventos e payloads em assinaturas Realtime, sem alterar a autoridade do Postgres nem da RLS.
- Relação com a stack: complementar ao Supabase/Postgres; não substitui SSR, consulta sob demanda, polling simples ou Broadcast quando esses mecanismos forem suficientes.
- Horizonte: Lite, Pro ou indefinido, conforme necessidade mensurável definida pelo Estrategista.

### Descrição

Postgres Changes passou a aceitar filtros combinados por `AND`, novos operadores (`like`, `ilike`, `is`, `match`, `imatch`, `isdistinct` e negações) e seleção explícita das colunas entregues em cada evento.

Filtros rejeitam eventos antes de chegarem ao cliente e a seleção reduz o payload, o que pode diminuir mensagens e egress cobrados. A seleção de colunas exige `@supabase/supabase-js` `2.109.0` ou superior; assinaturas existentes continuam recebendo a linha completa até optarem pelo recurso.

### Valor para o Projeto

- Pode reduzir tráfego e exposição desnecessária de campos em uma futura interface realmente dependente de atualização em tempo real.
- Permite filtrar no servidor por conta, estado e outro critério autorizado sem entregar ao cliente eventos que ele descartaria localmente.
- Mantém a RLS como controle obrigatório e pode reduzir custo de mensagens e egress em cenários com vários assinantes.

### Gatilho futuro de avaliação

Avaliar somente quando houver:

1. caso aprovado que exija atualização em tempo real e não seja atendido adequadamente por consulta sob demanda ou polling simples;
2. tabelas, eventos, papéis e políticas RLS definidos no recorte competente;
3. benefício mensurável de filtrar eventos ou reduzir payloads;
4. orçamento de mensagens e egress, limites de DELETE e comportamento de reconexão avaliados;
5. atualização deliberada e validada do `supabase-js` caso a seleção de colunas seja necessária.

### Dependências, riscos e limite

- Somente composição `AND` está disponível; `OR`, filtros de array/JSON, busca textual e operadores de range não estão incluídos.
- Eventos DELETE carregam apenas a chave primária e não podem ser avaliados por filtros de coluna.
- Toda coluna selecionada precisa ser visível ao papel assinante; RLS e grants continuam obrigatórios.
- Não criar publicação, canal, subscription, migration, rota ou upgrade de dependência nesta rodada.

### Fontes Oficiais

- [Supabase Blog — Postgres Changes gets AND filters, new operators, and column selection](https://supabase.com/blog/postgres-changes-filters-and-column-selection)
- [Supabase Docs — Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes)
- [Supabase Docs — Realtime Pricing](https://supabase.com/docs/guides/realtime/pricing)

### Registro (Tipo A — Realtime)

- Status: PENDENTE
- Verificado em: 2026-08-10
- Ambiente futuro: Supabase Realtime + cliente autorizado
- Evidência: fontes oficiais e busca semântica no repositório no SHA inicial da rodada.
- Observação: o registro não autoriza implementação nem atualização de dependência.

---

## 69 — Propagação de W3C Trace Context no `supabase-js` *(🟦 Disponível; adoção transversal condicional)*

2026-08-18  
Catalogado em 2026-08-20

### Status no Projeto

- Status: não implementado; capacidade transversal condicionada a necessidade real de correlação entre traces da aplicação e logs Supabase.
- Evidência: a E19.4 consolidou ownership único de `requestId` e observabilidade segura, mas não há `tracePropagation`, import de `@supabase/supabase-js/tracing` nem tracer OpenTelemetry no repositório; `package-lock.json` resolve `@supabase/supabase-js` em `2.89.0`.
- Natureza de uso: observabilidade transversal de aplicação e plataforma.
- Relação com a stack: complementar aos logs estruturados e ao `request_id` atuais; não os substitui e não cria valor sem span ativo e tracer compatível.
- Horizonte: indefinido, conforme necessidade operacional e decisão técnica própria.

### Descrição

O `supabase-js` pode propagar W3C Trace Context (`traceparent`, `tracestate` e `baggage`) para domínios Supabase. Com `tracePropagation` habilitado e um span ativo, o mesmo `trace_id` passa pelos logs do API Gateway e de Edge Functions e pode ser correlacionado por tracers compatíveis.

A integração é opt-in e exige carregar o entry point de tracing. A fonte oficial determina `supabase-js` `2.112.0` ou superior; versões `2.106.0` a `2.111.x` não propagavam os headers corretamente em aplicações empacotadas.

### Valor para o Projeto

- Pode reduzir o tempo de diagnóstico quando uma requisição atravessar aplicação, Supabase API Gateway e Edge Functions.
- Complementa a correlação segura já adotada com `requestId`, sem exigir que payloads, prompts, PII ou secrets sejam registrados.
- Pode aumentar o valor futuro de Log Drains ou de um tracer já aprovado, mantendo um identificador padrão entre camadas.

### Gatilho futuro de avaliação

Avaliar somente quando houver:

1. incidente ou fluxo aprovado cuja investigação dependa de correlação entre aplicação e logs Supabase;
2. tracer W3C/OpenTelemetry ou destino de observabilidade já aprovado, com ownership e retenção definidos;
3. benefício mensurável sobre os logs estruturados e o `requestId` atuais;
4. plano deliberado de atualização e validação do `supabase-js` para `2.112.0` ou superior.

### Dependências, riscos e limite

- Exige tracer registrado e span ativo; sem isso, a opção não produz trace útil.
- A cobertura oficial atual alcança logs do API Gateway e de Edge Functions, não todos os serviços Supabase.
- Sampling, cardinalidade, custo, retenção e conteúdo de `baggage` precisam de política segura.
- Não instalar OpenTelemetry, não atualizar dependência, não habilitar `tracePropagation`, não criar Log Drain e não alterar runtime nesta rodada.
- O registro não autoriza implementação nem nova infraestrutura de observabilidade.

### Fonte Oficial

- [Supabase Blog — Connect client traces to your logs](https://supabase.com/blog/connect-client-traces-to-your-logs)

### Registro (Tipo C — Observabilidade transversal)

- Status: PENDENTE
- Verificado em: 2026-08-20
- Ambiente futuro: aplicação TypeScript + `supabase-js` compatível + tracer aprovado
- Evidência: fonte oficial, E19.4 no roadmap e busca semântica no repositório no SHA inicial da rodada.
- Observação: prioridade e adoção dependem de avaliação técnica ou operacional própria.

---

## 70 — Monitores read-only de observabilidade com agentes *(🧪 Oficial; adoção transversal condicionada)*

2026-09-05  
Catalogado em 2026-09-05

### Status no Projeto

- Status: não implementado; o projeto mantém inspeção SQL read-only via GitHub Actions e o Supabase Plugin preservado, mas não possui monitor agendado que use `query_logs`, `get_advisors` e `execute_sql` pelo Supabase MCP.
- Evidência: `docs/roadmap.md` 17.1 e 22.3, `docs/automations.md` 3.1 e 3.3, `docs/platform-config.md` 4.7 e busca semântica no repositório no SHA inicial da rodada.
- Natureza de uso: observabilidade operacional transversal.
- Relação com a stack: complementar a `supa#5`, `supa#33`, `supa#46` e `supa#59`, mas sobreposto ao `pipeline-supabase-inspect` para verificações que a automação atual já consiga executar com menor custo e complexidade.
- Horizonte: indefinido; depende de avaliação técnica ou operacional própria, não de plano comercial.

### Descrição

A Supabase passou a documentar rotinas de agente read-only para saúde, segurança, desempenho e capacidade. As rotinas usam o Supabase MCP limitado ao projeto, com `read_only=true`, e produzem achados sem alterar o ambiente.

Para projetos pequenos, a orientação oficial é começar com um único monitor relevante em cadência diária ou semanal e somente separar agentes quando fontes, responsáveis, cadências ou limiares realmente diferirem. O Generalist reúne as quatro categorias e pode permanecer silencioso quando nada exigir ação.

### Valor para o Projeto

- Pode reduzir inspeção manual recorrente de erros, Auth, Advisors, queries lentas, locks e crescimento de recursos.
- Pode transformar sinais já disponíveis em alertas com limiares explícitos e próximo passo humano, sem autorizar correção automática.
- Pode complementar a inspeção pós-deploy e a governança do Gestor de Segurança.
- Preserva uma alternativa oficial antes de construir monitor, dashboard ou serviço próprio.

### Hipótese de superioridade e gatilho objetivo

Avaliar somente quando houver:

1. necessidade recorrente comprovada de detectar incidente, regressão, risco de segurança ou aproximação de limite;
2. comparação com o `pipeline-supabase-inspect` atual, demonstrando ganho mensurável de cobertura, tempo de diagnóstico ou redução de SQL manual;
3. acesso Supabase MCP project-scoped e read-only validado, com minimização e redação de dados sensíveis;
4. execução inicial sob demanda e revisão humana dos primeiros resultados, limiares e falsos positivos;
5. decisão entre um Generalist diário ou semanal e monitores especializados, preferindo um único fluxo enquanto o projeto permanecer pequeno.

### Dependências, riscos e limites

- Depende de Supabase MCP autorizado, harness com agendamento e custo conhecido das execuções de IA.
- Logs e resultados podem conter dados pessoais ou sensíveis; evidências devem ser agregadas e redigidas.
- O MCP não expõe totais de billing da organização, e estimativas de capacidade não podem ser tratadas como cobrança oficial.
- O service/MCP próprio Supabase Inspect foi removido na E22.3; este item não autoriza recriá-lo, criar substituto ou reintroduzir infraestrutura.
- Não substitui logs estruturados, `request_id`, tracing, Log Drains, validação humana nem o contrato do banco.
- Não executar correções, SQL mutável, cancelamento de sessão, alteração de policy, grant, chave, compute, plano ou billing.
- Não criar agente, automação, service, rota, job, dashboard, banco ou nova infraestrutura nesta rodada.

### Ações Recomendadas

1. Manter como capacidade transversal condicionada.
2. Reavaliar no primeiro caso de monitoramento recorrente ou antes do go-live com tráfego real.
3. Se o gatilho ocorrer, provar primeiro um Generalist read-only sob demanda e comparar com a automação atual.
4. Encaminhar eventual adoção ao fluxo competente de automações e segurança, sem decisão final neste catálogo.

### Fontes Oficiais

- [Supabase Docs — Hire an agent](https://supabase.com/docs/guides/observability/automate-with-agents)
- [Supabase Docs — Generalist](https://supabase.com/docs/guides/observability/automate-with-agents/all)
- [Supabase Docs — Health monitor](https://supabase.com/docs/guides/observability/automate-with-agents/health)
- [Supabase Docs — Security monitor](https://supabase.com/docs/guides/observability/automate-with-agents/security)
- [Supabase Docs — Performance monitor](https://supabase.com/docs/guides/observability/automate-with-agents/performance)
- [Supabase Docs — Capacity monitor](https://supabase.com/docs/guides/observability/automate-with-agents/usage)

### Registro (Tipo C — Observabilidade transversal)

- Status: PENDENTE
- Verificado em: 2026-09-05
- Ambiente futuro: Supabase MCP oficial read-only + harness autorizado
- Evidência: fontes oficiais e gate de rastreabilidade no repositório.
- Observação: o registro não autoriza implementação, agendamento nem nova infraestrutura.

---

## Registro da rodada — Supabase Update August 2026 — 10/08/2026

### Updates ajustados ou incorporados

- `supa#5`, `supa#12`, `supa#32`, `supa#33`, `supa#39`, `supa#41`, `supa#59` e `supa#62` foram reconciliados com fontes oficiais e o estado do projeto.
- `supa#65` e `supa#66` foram adicionados como capacidades condicionais.
- `supa#67` foi adicionado para registrar a depreciação de version pinning em extensões.
- `supa#68` foi adicionado como capacidade condicional para assinaturas Postgres Changes com menor volume de eventos e payloads.

### Updates avaliados e não adicionados nesta atualização

- Conector Supabase para Perplexity Computer: integração oficial disponível, mas sobrepõe conectores e ferramentas assistivas já registrados sem caso operacional aprovado, hipótese de superioridade ou gatilho objetivo para comparação. Não foi descartado por distância do MVP; pode ser reavaliado se houver fluxo multiapp concreto que as ferramentas atuais não atendam.

### Cobertura estratégica desta atualização

- Landing pages, Instagram, WhatsApp e e-mail foram pesquisados contra as fontes oficiais Supabase aplicáveis.
- A melhoria de Postgres Changes pode apoiar interfaces futuras do produto, mas não altera nem autoriza os fluxos atuais desses canais.
- Não foi encontrada, entre 05/08/2026 e 10/08/2026, outra novidade oficial Supabase com valor concreto e horizonte plausível para os canais estratégicos do projeto.

### IDs preservados por rastreabilidade

- `supa#7`, `supa#10`, `supa#14`, `supa#15`, `supa#16` e `supa#18` permanecem como registros históricos com estado final ou item substituto.
- `supa#19` preserva a implementação parcial do tracking canônico e sua transferência estratégica para `prod#15`.
- `supa#20` preserva a evolução parcial de grants para o modelo local de entitlements.
- `supa#25`, `supa#27`, `supa#28` e `supa#29` permanecem rastreáveis como propostas internas não implementadas ou transferidas.
- `supa#30` registra a implementação dos templates nativos no recorte E11.
- `supa#37` permanece como capacidade oficial condicional para eventual serviço Python.

### Pontos não validados e lacunas documentais

- Unified Logs: rollout e disponibilidade no projeto ainda precisam de confirmação no Dashboard.
- `pg_graphql`: retirada do ambiente, config e documentação depende de fase técnica separada.
- Passkeys e CipherStash: preços, maturidade operacional e adequação só devem ser levantados se os gatilhos ocorrerem.
- Grafana Cloud: acesso, retenção e responsabilidade operacional ainda não definidos.
- Version pinning: a presença de cláusulas explícitas nas migrations deve ser confirmada em recorte técnico antes de qualquer ajuste.
- Postgres Changes: não há caso Realtime aprovado; seleção de colunas depende de `supabase-js` `2.109.0` ou superior, acima da versão resolvida atual.

### Validação de IDs

- Nenhum ID publicado desapareceu, foi renumerado ou reutilizado.
- Implementação, absorção, rejeição ou distância do Starter não foram tratadas como autorização para apagar referências.
- Registros históricos não autorizam implementação nem reativam propostas superadas.

### Limite da rodada

- Nenhuma extensão, biblioteca, tabela, policy, rota, job, agente, automação ou infraestrutura foi criada.
- Nenhuma configuração do projeto Supabase foi alterada.
- O catálogo recomenda avaliação futura; não autoriza implementação, contratação ou mudança de stack.


## Registro da rodada — Supabase Update August 2026 — 20/08/2026

### Updates ajustados ou incorporados

- `supa#69` foi adicionado como capacidade transversal e condicional de correlação entre traces da aplicação e logs Supabase.
- Nenhum item existente foi arquivado, absorvido, superado ou reclassificado nesta rodada.

### Updates avaliados e não adicionados nesta atualização

- Não houve outro recurso oficial Supabase novo ou materialmente alterado entre 11/08/2026 e 20/08/2026 com valor concreto e horizonte plausível adicional para o LP Factory 10.
- A ausência de adição não foi determinada por distância do Starter ou do MVP, mas por falta de novidade material adicional nas fontes oficiais pesquisadas.

### Cobertura estratégica desta atualização

- Landing pages, Instagram, WhatsApp e e-mail foram pesquisados contra as fontes oficiais aplicáveis.
- A propagação de traces pode apoiar o diagnóstico dos canais quando eles atravessarem APIs Supabase ou Edge Functions, mas não altera nem autoriza seus fluxos.
- Não foi encontrada novidade oficial Supabase específica e relevante para esses canais no período; as fontes oficiais da WhatsApp Business Platform/Meta Business Messaging também não apresentaram update aplicável ao catálogo Supabase nesta rodada.

### IDs preservados por rastreabilidade

- Todos os IDs publicados de `supa#2` a `supa#68`, inclusive os registros históricos e os intervalos não utilizados, permanecem sem renumeração, reutilização ou desaparecimento.
- `supa#69` é o único novo ID e está acima do maior ID histórico anterior.

### Pontos não validados e lacunas documentais

- `supa#69`: não existe tracer aprovado nem caso operacional que justifique adoção; maturidade efetiva no projeto depende de futuro recorte técnico e de `supabase-js` `2.112.0` ou superior.
- Permanecem as lacunas da rodada anterior, inclusive disponibilidade do Unified Logs no projeto, retirada de `pg_graphql`, ownership do Grafana Cloud e confirmação técnica sobre migrations com version pinning.

### Validação de IDs e rastreabilidade

- Nenhum ID publicado desapareceu, foi renumerado ou reutilizado.
- Não houve arquivamento; a busca por referências explícitas e implementação semântica confirmou a observabilidade segura da E19.4 e a ausência de `tracePropagation` no estado inicial.
- A catalogação adere ao `README.md` e não adotou novidade, modernidade ou distância do MVP como decisão isolada.

### Limite da rodada

- Nenhuma dependência, extensão, tabela, policy, rota, job, agente, automação, tracer, Log Drain ou infraestrutura foi criada.
- Nenhuma configuração do projeto Supabase nem runtime foi alterada.
- O catálogo recomenda avaliação futura; não autoriza implementação, contratação ou mudança de stack.

## Registro da rodada — Supabase Update September 2026 — 05/09/2026

### Updates ajustados ou incorporados

- `supa#70` foi adicionado como capacidade transversal condicionada para monitoramento read-only por agentes, com comparação obrigatória contra a inspeção GitHub existente e sem reintrodução automática do MCP removido na E22.3.
- Nenhum item existente foi arquivado, absorvido, superado ou reclassificado nesta rodada.

### Updates avaliados e não adicionados nesta atualização

- Enterprise-managed auth para o Supabase MCP: disponível em Supabase Team ou Enterprise com Okta SSO e Claude Team ou Enterprise; não cobre o harness atual, não cria capacidade adicional para o produto e permanece absorvido pelo radar geral de governança de `supa#59`.
- Novidades gerais de WhatsApp sobre segurança de conta e pagamentos de contas na Índia não alteram a WhatsApp Business Platform aplicável ao projeto nem criam recurso Supabase.
- Não houve outro recurso oficial Supabase novo ou materialmente alterado entre 21/08/2026 e 05/09/2026 com valor concreto e horizonte plausível adicional para o LP Factory 10.
- Nenhum recurso foi excluído apenas por estar fora do Starter ou do MVP.

### Cobertura estratégica desta atualização

- IA, automações e agentes: blog, changelog e documentação oficial Supabase; o impacto material foi registrado em `supa#70`.
- Landing pages, Instagram e e-mail: não foi encontrada novidade oficial Supabase específica e relevante no período.
- WhatsApp: fontes oficiais da WhatsApp Business Platform e Meta Business Messaging foram pesquisadas; não houve mudança aplicável ao catálogo Supabase.
- Segurança e operação: a autenticação empresarial do MCP foi avaliada, mas não se aplica ao ambiente atual nem supera a governança existente.
- Os canais permanecem sem alteração de fluxo, integração ou autorização de implementação.

### IDs preservados por rastreabilidade

- Todos os IDs publicados de `supa#2` a `supa#69`, inclusive registros históricos e intervalos não utilizados, permanecem sem renumeração, reutilização ou desaparecimento.
- `supa#70` foi atribuído acima do maior ID histórico anterior.

### Pontos não validados e lacunas documentais

- A documentação oficial consultada não informa uma data de publicação na própria página dos monitores; a capacidade e as instruções estavam disponíveis e foram verificadas em 05/09/2026.
- `supa#70`: não há baseline de falsos positivos, custo por execução, autorização de agendamento nem prova de superioridade sobre o `pipeline-supabase-inspect`.
- Permanecem as lacunas anteriores que ainda não foram encerradas nos respectivos itens, inclusive Unified Logs, `pg_graphql`, Grafana Cloud e tracing.

### Validação de IDs e rastreabilidade

- Nenhum ID publicado desapareceu, foi renumerado ou reutilizado.
- Antes da adição, foram buscados `supa#59`, `supa#5`, `supa#33`, `supa#46`, Supabase Inspect, MCP, `query_logs`, `get_advisors`, monitoramento, agentes e os artefatos associados em documentos, código e histórico de PRs.
- A busca confirmou a automação GitHub read-only preservada, o plugin Supabase e a retirada do service/MCP próprio, sem monitor agendado equivalente.
- A catalogação adere ao `README.md` e não adotou novidade, modernidade ou distância do MVP como decisão isolada.

### Limite da rodada

- Nenhuma dependência, extensão, tabela, policy, rota, job, agente, automação, monitor, MCP, service ou infraestrutura foi criada.
- Nenhuma configuração do projeto Supabase nem runtime foi alterada.
- O catálogo recomenda avaliação futura; não autoriza implementação, agendamento, contratação ou mudança de stack.

