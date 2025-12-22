# LP Factory 10 — Estratégia de Produtos  

---

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

## 2 — Tokens Pessoais com Expiração *(🟩 Estável)*  
2025-05-18  

### Descrição  
Admins e desenvolvedores podem criar tokens temporários (30/90 dias) no Dashboard para integrações seguras.  

### Valor para o Projeto  
- Melhora governança e segurança.  
- Facilita automações entre parceiros.  

### Valor para o Usuário  
- Garante controle e rastreabilidade de acessos.  

---

## 3 — Speed Insights *(🟩 Estável)*  
2025-06-01  

### Descrição  
Monitoramento contínuo de Core Web Vitals (LCP, CLS, FID) com dados reais de usuários.  

### Valor para o Projeto  
- Integra métricas da Vercel para diagnósticos de UX.  

### Valor para o Usuário  
- Experiência mais fluida e responsiva.  

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

## 5 — Checklist + CI/ESLint *(🟩 Estável)*  
2025-08-01  

### Descrição  
Implementa validações automáticas de segurança e governança (CI + Lint) com base no MRVG.  

### Valor para o Projeto  
- Reduz regressões e falhas manuais.  
- Garante conformidade com a Base Técnica.  

### Valor para o Usuário  
- Mais estabilidade e confiança no produto.  

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

## 10 — Estratégias Futuras (2025-2026) *(🟣 Ideias Iniciais)*  
2025-11-12  

### Descrição  
Conjunto de iniciativas em estudo, priorizando expansão e automação:  
- Simplificação de UX no Dashboard  
- Teste de Verticais mensais  
- Modelo Light de LPs  
- Ajuste entre Setup e Mensalidade  
- Pricing por Ação/Consumo  

### Valor para o Projeto  
- Garante escalabilidade controlada.  
- Direciona roadmap de inovação.  

### Valor para o Usuário  
- Experiência mais simples, previsível e sob demanda.  

---

## 11 — Casos 2025 — Automações de Vendas *(🟩 Estável)*  
2025-11-12  

### Descrição  
Iniciativa estratégica baseada em estudos de caso reais (FUNNYFUZZY e Sandler) para estruturar automações de qualificação e scoring de leads.  

### Valor para o Projeto  
- Cria sinergia entre Supabase e Vercel Edge Tracking.  
- Oferece modelo prático de retroalimentação de campanhas e dados de conversão.  
- Fundamenta a camada de automação de marketing consultivo.  

### Valor para o Usuário  
- Leads mais qualificados e custos de mídia reduzidos.  
- Campanhas com aprendizado automático e foco em resultado.  

### Ações Recomendadas  
1. Mapear fluxos de automação por vertical.  
2. Integrar métricas de scoring ao dashboard de contas.  

---

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
## 13 — Planos como Rótulos → Bundles de Grants *(🟣 Ideia Inicial)*  
2025-11-20  

### Descrição  
Desacoplar os planos comerciais (Light/Pro/Ultra/Consultivo) das features codificadas, tratando cada plano como um **rótulo** que aponta para um **bundle de grants** (permissões e limites) configurável por conta.

### Valor para o Projeto  
- Permite alterar o que cada plano inclui **sem migração de schema**.  
- Unifica a lógica de planos entre SaaS e contas consultivas (modelo híbrido).  
- Reduz risco de regressão ao lançar novas features ou limites.  

### Valor para o Usuário  
- Facilita upgrades/downgrades e ofertas personalizadas por conta.  
- Habilita modelos de teste (trial, beta fechado) sem “quebrar” contratos atuais.  
- Garante maior previsibilidade: o cliente sabe o que está ativo na própria conta.  

### Ações Recomendadas  
1. Definir taxonomia de **grants** (ex.: `lp.create`, `lp.analytics.view`, `section.ab_test.run`).  
2. Mapear bundles padrão por plano (`plan.light`, `plan.pro`, `plan.ultra`, `plan.consultivo`).  
3. Implementar resolução de acesso via grants (fallback: seção → LP → conta → plano → default).  
4. Documentar estratégia de snapshot por conta para preservar histórico de recursos.  

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

   ---

   ## 15 — Automação de Microeventos em LPs *(🧪 Experimental)*
2025-11-17

### Descrição
Implementar um fluxo de marketing que detecta microeventos da Landing Page (ex.: scroll 25/50/75%, visualização de preços, clique em CTA, envio de formulário) para taguear dinamicamente os leads (e.g. `interesse_preço`, `scroll_75`, `form_enviado`) e disparar ações em RD Station e Meta Ads. As tags alimentam segmentações de remarketing e fluxos de follow‑up (e‑mail/WhatsApp), encurtando o ciclo de vendas e aumentando o ROI.

### Valor para o Projeto
- Conecta a camada de tracking interno e a camada de remarketing em um modelo de automação reutilizável:contentReference[oaicite:4]{index=4}.
- Aproveita integrações existentes (events_analytics, RD, Meta) para oferecer uma solução pronta de “microeventos → tags → fluxos”.
- Testa, em ambiente controlado, a eficácia de eventos contextuais antes de escalar para outras verticais.

### Valor para o Usuário
- Aumenta a relevância dos contatos ao reagir em minutos ao comportamento real do visitante:contentReference[oaicite:5]{index=5}.
- Diminui o custo de aquisição reaproveitando o tráfego da própria LP com remarketing segmentado:contentReference[oaicite:6]{index=6}.
- Permite otimizar criativos e mensagens por contexto (interesse em preços, FAQ, scroll avançado).

### Ações Recomendadas
1. Definir a taxonomia de microeventos (`scroll_25/50/75`, `cta_click`, `faq_open`, `pricing_view`, `form_submit`) e padrão de nomes (`lp.{slug}.{evento}`).
2. Registrar esses eventos no `events_analytics` e expor função server‑side para enviá‑los a RD Station e Meta (via Camada de Remarketing).
3. Configurar tags e fluxos no RD: sequências específicas para quem visualizou preços sem converter, abriu FAQ sem clicar, enviou formulário etc.
4. Criar públicos de remarketing e lookalike em Meta Ads com base nas tags (`pricing_view`, `scroll_75`, `form_submit`), com criativos adaptados.
5. Medir KPIs essenciais: tempo até primeiro contato, taxa de qualificação (MQL), CPL/CPA por microevento e redução no ciclo de vendas.

---


