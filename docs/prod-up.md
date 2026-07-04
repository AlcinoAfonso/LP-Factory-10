# LP Factory 10 — Estratégia de Produtos  

---

## Objetivo e escopo

Este documento registra práticas, capacidades e tendências externas que possam gerar valor concreto para o produto LP Factory 10.

Só devem entrar updates relacionados a:

* UX e acessibilidade;
* aquisição, conversão e retenção;
* onboarding e experiência do usuário;
* monetização, billing e pricing;
* analytics de produto;
* performance percebida;
* automação comercial;
* experiências de produto assistidas por IA.

Não registrar novidades genéricas sem caso de uso, impacto ou decisão aplicável ao projeto.

## Fontes prioritárias

A pesquisa deve usar prioritariamente documentação oficial de:

* OpenAI, para IA, agentes e experiências assistidas;
* Google Search Central e web.dev, para SEO, performance e experiência web;
* Meta e Google Ads, para aquisição, conversão e tracking;
* Stripe, para billing, checkout, pricing e monetização;
* W3C/WAI, para acessibilidade e WCAG.

Vercel, Supabase e GitHub entram apenas quando o recurso tiver impacto direto em produto ou experiência. A descrição técnica completa deve permanecer nos respectivos catálogos, com referência curta neste documento para evitar duplicação.

Fontes secundárias podem apoiar a análise, mas não devem substituir documentação oficial.

## Critério de validação

Antes de registrar ou atualizar um item:

1. confirmar o estado atual na fonte oficial;
2. identificar valor concreto para o LP Factory 10;
3. verificar custo, plano, maturidade e dependências;
4. definir se o recurso deve ser adotado, avaliado depois ou descartado;
5. confirmar no roadmap e no repositório se já existe implementação.

## Convenção de referência

O identificador canônico dos itens deste catálogo é `prod#n`.

Esse identificador deve ser usado no roadmap, Base Técnica, briefings, relatórios e referências cruzadas. A numeração não deve ser reutilizada após remoção, depreciação ou substituição de um item.

## Critério do catálogo ativo

Este documento deve manter apenas práticas, capacidades e tendências de produto que ainda possam ser aproveitadas pelo Gestor de Updates em algum caso atual, futuro ou condicional.

Itens já absorvidos pela Base Técnica, duplicados em catálogos técnicos, genéricos demais ou sem aproveitamento concreto não permanecem no catálogo ativo.

Recursos pagos, enterprise ou futuros podem permanecer quando ainda tiverem aproveitamento possível em algum caso específico.

A rejeição ou adoção de cada item deve ser decidida caso a caso pelo Gestor de Updates, conforme o plano-base avaliado.

## 1 — SSO Self-Service *(🟩 Estável)*  
2025-05-11  

### Descrição  
Permite configuração autônoma de logins corporativos (Google Workspace, Azure AD, Okta) no Dashboard.  

### Valor para o Projeto  
- Reduz suporte técnico.  
- Reforça governança multi-tenant.  

### Valor para o Usuário  
- Simplifica onboarding em empresas.  

---

## 3 — Speed Insights *(🟩 Estável)*  
2025-06-01  

### Descrição  
Monitoramento de experiência real com LCP, CLS e INP, além de métricas complementares como FCP, TBT e TTFB. O painel consolida os dados no Real Experience Score e permite filtrar resultados por desktop/mobile e por ambiente, incluindo Preview e produção. A disponibilidade, a janela de retenção, o volume de data points e os custos variam conforme o plano Vercel.

### Valor para o Projeto  
- Integra métricas da Vercel para diagnósticos de UX com recortes por dispositivo e ambiente.
- Permite comparar o primeiro Preview funcional com produção sem transformar analytics em requisito de entrega.

### Valor para o Usuário  
- Experiência mais fluida, responsiva e visualmente estável.

### Observação de fonte oficial

- INP é métrica estável de Core Web Vitals para avaliar responsividade de interações ao longo da vida da página.
- INP sucede FID por medir mais do que apenas a primeira interação.
- Usar essa referência para QA de performance percebida, sem transformar analytics em bloqueio da primeira entrega.

### Registro (Tipo A — Plataforma)  
- Status: DEFERIDO  
- Observação: reavaliar na E10.6 após o primeiro Preview funcional; não bloquear a primeira entrega.

---

## 4 — Agent Experience (AX) *(🧪 Experimental)*  
2025-07-01  

### Descrição  
Estruturar o produto para ser “compreendido” por agentes de IA via endpoints e metadados semânticos.  

### Valor para o Projeto  
- Prepara o produto para automações avançadas.  

### Valor para o Usuário  
- Experiências inteligentes e adaptativas.  

---

## 6 — Conteúdo IA-Ready + Smart Gating *(🟧 Em Rollout)*  
2025-09-01  

### Descrição  
LPs otimizadas para Zero-Click/IA, combinando conteúdo aberto e premium com gating inteligente.  

### Valor para o Projeto  
- Cria base para IA Visibility e LLMO.  
- Reforça autoridade topical.  

### Valor para o Usuário  
- Gera visibilidade sem clique e leads mais qualificados.  

---

## 7 — Estratégia de Lealdade Opt-in *(🟧 Em Rollout)*  
2025-09-15  

### Descrição  
Implementar CTAs para que usuários adicionem a marca como “fonte preferida” em buscadores e newsletters.  

### Valor para o Projeto  
- Amplia retenção de tráfego orgânico.  

### Valor para o Usuário  
- Experiência personalizada e contínua.  

---

## 8 — Meta Ads Value Rules + Tracking Inteligente *(🧪 Experimental)*  
2025-10-10  

### Descrição  
LPs passam a enviar dados de comportamento diretamente para Ads APIs (Server-side Tracking).  

### Valor para o Projeto  
- Reduz dependência de tags externas.  
- Base para pricing e relatórios consultivos.  

### Valor para o Usuário  
- Leads mais qualificados e campanhas otimizadas.  

---

## 9 — Google Ads Text Guidelines *(🟩 Preparado)*  
2025-10-14  

### Descrição  
Permite definir regras de redação e tom de marca para anúncios IA (Text Customization).  

### Valor para o Projeto  
- Reforça governança e consistência da comunicação.  

### Valor para o Usuário  
- Clareza e coerência nas mensagens de campanha.  

---

## 12 — Navegação Multi-contas e LPs (UX mínima viável) *(🟣 Ideia Inicial)*  
2025-11-20  

### Descrição  
Definir uma navegação hierárquica clara — **Parceiro → Conta → LP → Seção** — com breadcrumbs clicáveis, troca rápida via atalho (⌘K/ctrl+K), favoritos/recentes e identificação visual por cores/avatars em cada nível.

### Valor para o Projeto  
- Reduz a complexidade de uso em cenários multi-conta e multi-LP.  
- Cria base de UX para o **Partner Dashboard** e para operação de agências.  
- Prepara terreno para futuras automações contextuais (IA, relatórios, ações em massa).

### Valor para o Usuário  
- Entende rapidamente “onde está” e “de quem é” cada LP.  
- Encontra contas, LPs e seções com menos cliques e mais previsibilidade.  
- Ganha velocidade no dia a dia, especialmente em agências com muitos clientes.

### Ações Recomendadas  
1. Definir padrão canônico de breadcrumbs (Parceiro/Conta/LP/Seção) e estados vazios.  
2. Implementar um **Switcher global (⌘K/ctrl+K)** com busca unificada e favoritos/recentes.  
3. Padronizar cores e avatars por entidade (Parceiro, Conta, LP, Seção).  
4. Integrar telemetria de navegação (aberturas, trocas, favoritos) ao dashboard de contas.  

---

## 14 — Priorizar Reconhecimento nos Testes Iniciais *(🟣 Ideia Inicial)*  
2025-11-20  

### Descrição  
Estabelecer diretrizes de UX e roteiros de teste que privilegiem **ações visíveis e reconhecimento** (o usuário “vê o que pode fazer”), evitando interfaces escondidas e o “mito dos 3 cliques” como métrica única.

### Valor para o Projeto  
- Melhora a taxa de sucesso em testes internos (dogfooding) e pilotos com clientes.  
- Reduz ruído na avaliação de features, focando em clareza e não apenas em profundidade de navegação.  
- Cria um padrão de UX testável e replicável para novos módulos do produto.  

### Valor para o Usuário  
- Entende mais rápido o que o painel oferece logo nos primeiros acessos.  
- Encontra caminhos óbvios para “próximas ações” (criar LP, ver resultados, ajustar plano).  
- Ganha confiança na plataforma ao perceber controle e transparência desde o início.  

### Ações Recomendadas  
1. Definir um conjunto de **cenários de onboarding** focados em reconhecimento (ex.: “criar primeira LP”, “ver resultados”, “convidar alguém”).  
2. Padronizar layouts iniciais com CTAs claros e seções prioritárias sempre visíveis na primeira dobra.  
3. Incluir métricas de sucesso específicas em testes (tempo até a primeira ação, ações descobertas sem ajuda, abandono).  
4. Incorporar essas diretrizes no checklist de UX dos próximos releases (E10, E12, novos dashboards).
5. Aplicar diretamente na E10.6 à revisão do hero, primeira dobra, cards e CTAs.

---

## 15 — Automação de Microeventos em LPs *(🧪 Experimental)*
2025-11-17

### Descrição
Implementar um fluxo de marketing que detecta microeventos da Landing Page (ex.: scroll 25/50/75%, visualização de preços, clique em CTA, envio de formulário) para taguear dinamicamente os leads (e.g. `interesse_preço`, `scroll_75`, `form_enviado`) e disparar ações em RD Station e Meta Ads. As tags alimentam segmentações de remarketing e fluxos de follow‑up (e‑mail/WhatsApp), encurtando o ciclo de vendas e aumentando o ROI.

### Valor para o Projeto
- Conecta a camada de tracking interno e a camada de remarketing em um modelo de automação reutilizável.
- Aproveita integrações existentes (events_analytics, RD, Meta) para oferecer uma solução pronta de “microeventos → tags → fluxos”.
- Testa, em ambiente controlado, a eficácia de eventos contextuais antes de escalar para outras verticais.

### Valor para o Usuário
- Aumenta a relevância dos contatos ao reagir em minutos ao comportamento real do visitante.
- Diminui o custo de aquisição reaproveitando o tráfego da própria LP com remarketing segmentado.
- Permite otimizar criativos e mensagens por contexto (interesse em preços, FAQ, scroll avançado).

### Ações Recomendadas
1. Antes de depender de eventos server-side, verificar o plano Vercel/Analytics e definir uma estratégia única de tracking.
2. Não aplicar esta automação à primeira entrega genérica da E10.6.
3. Definir a taxonomia de microeventos (`scroll_25/50/75`, `cta_click`, `faq_open`, `pricing_view`, `form_submit`) e padrão de nomes (`lp.{slug}.{evento}`).
4. Registrar esses eventos no `events_analytics` e expor função server‑side para enviá‑los a RD Station e Meta (via Camada de Remarketing).
5. Configurar tags e fluxos no RD: sequências específicas para quem visualizou preços sem converter, abriu FAQ sem clicar, enviou formulário etc.
6. Criar públicos de remarketing e lookalike em Meta Ads com base nas tags (`pricing_view`, `scroll_75`, `form_submit`), com criativos adaptados.
7. Medir KPIs essenciais: tempo até primeiro contato, taxa de qualificação (MQL), CPL/CPA por microevento e redução no ciclo de vendas.

---

## 16 — QA visual e validação de UX em Preview *(🟩 Prática de validação)*
2026-06-12

### Descrição
Prática de produto para revisar páginas em Preview antes da aprovação, usando comentários localizados e inspeções de acessibilidade, foco, timing de interação e layout shift. Os recursos técnicos — Vercel Toolbar, Comments, Accessibility Audit Tool, Interaction Timing Tool e Layout Shift Tool — estão detalhados no `docs/vercel-up.md`.

### Valor para o Projeto
- Estrutura a revisão da E10.6 em hero, benefícios, serviços, cards, FAQ, CTAs e responsividade.
- Centraliza feedback visual e de copy no contexto da página, reduzindo prints soltos e retrabalho.

### Valor para o Usuário
- Aumenta clareza, acessibilidade, estabilidade visual e resposta percebida antes da publicação.

### Ações Recomendadas
1. Aplicar como prática de validação no Preview da E10.6 após existir uma página funcional.
2. Usar os recursos disponíveis no ambiente/plano sem criar nova infraestrutura, banco, IA ou experimento A/B.
3. Manter validação manual de conteúdo, navegação, foco e responsividade como parte da aprovação.

---

## 17 — WCAG 2.2 como baseline de acessibilidade *(🟩 Recomendação W3C)*

2026-07-04

### Descrição

Usar WCAG 2.2 como referência de produto para acessibilidade em LPs, dashboards e fluxos de onboarding, especialmente em contraste, foco, navegação por teclado, rótulos, mensagens de erro, alvo de toque e autenticação acessível.

### Valor para o Projeto

- Cria um baseline claro para QA de UX e acessibilidade.
- Ajuda a evitar decisões subjetivas em revisões visuais.
- Complementa o uso de ferramentas de Preview sem substituir validação manual.

### Valor para o Usuário

- Melhora legibilidade, navegação, compreensão e uso por pessoas com diferentes necessidades de acesso.

### Ações Recomendadas

1. Usar como referência de checklist em revisões de UX.
2. Não transformar em auditoria completa de conformidade no MVP.
3. Priorizar critérios aplicáveis a LPs, auth, onboarding e dashboards reais.

---

## 18 — OpenAI Apps SDK / ChatGPT Apps *(🟨 Avaliação futura)*

2026-07-04

### Descrição

Framework da OpenAI para criar apps que estendem o ChatGPT com servidor MCP, UI própria, autenticação, estado, monetização, deploy, conexão e submissão para distribuição.

### Valor para o Projeto

- Pode virar canal futuro para experiências assistidas por IA ligadas ao LP Factory 10.
- Pode apoiar casos como diagnóstico de LP, orientação comercial, briefing assistido, análise de campanhas ou consulta de relatórios.
- Não substitui o produto web nem deve entrar no MVP sem caso aprovado.

### Valor para o Usuário

- Pode permitir interação assistida por IA em um ambiente já usado pelo cliente, com fluxos mais guiados e contextuais.

### Ações Recomendadas

1. Manter como avaliação futura.
2. Não criar app ChatGPT sem plano próprio.
3. Só considerar quando houver caso real, política de dados, UX e critério de distribuição aprovados.

---

## 19 — Stripe Entitlements como referência de feature access *(🟩 Estável)*

2026-07-04

### Descrição

Referência externa da Stripe para concessão e revogação de acesso a features de produto conforme assinatura, plano ou entitlement.

### Valor para o Projeto

- Serve como benchmark de produto para mapear acesso por plano, feature e conta.
- Pode apoiar a evolução conceitual de billing, upgrades, trials e permissões comerciais.
- Não substitui o modelo interno do LP Factory 10 nem `public.account_commercial_entitlements`.

### Valor para o Usuário

- Pode contribuir para upgrades, downgrades e liberações de recursos mais previsíveis.

### Ações Recomendadas

1. Manter como referência de produto.
2. Não substituir o modelo interno de grants/entitlements já definido no projeto.
3. Avaliar apenas em conjunto com E9, Base Técnica e schema vigente.

---
