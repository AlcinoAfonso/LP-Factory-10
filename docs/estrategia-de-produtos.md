# LP Factory 10 — Estratégia de Produto
**Versão:** 1.2  
**Data:** 05/11/2025  
**Propósito:** Benchmark competitivo e visão estratégica de diferenciação.

---

## 1. Benchmark Competitivo

### 1.1 RD Station
**Posicionamento atual:**  
Foca em IA aplicada a campanhas, automação de marketing e CRM (eficiência e simplicidade), além de forte uso de conteúdo *gated/free* (ebooks, templates, calendários) para capturar e nutrir leads.

**Exemplos:**
- (24/09/2025) Demonstração gratuita de IA integrada ao RD Station.  
- (24/09/2025) Email com múltiplos ebooks e templates gratuitos como iscas de segmentação e captura.

**Risco para LP Factory:**  
Percepção de que a RD já resolve tudo (IA + geração/nutrição de leads) → pode abafar nossa narrativa.

**Oportunidade:**  
LP Factory pode se diferenciar ao entregar **IA-ready em LPs (SEO 2.0, Zero-Click, LLMO)** e infraestrutura pronta para **Smart Gating** de conteúdos premium — algo que a RD não entrega no nível de página.

---

### 1.2 Validity
**Posicionamento:**  
Foco em uso ético de dados (*zero/first/third-party*) + *compliance* como valor de marca.

**Exemplo:**  
(01/10/2025) Webinar sobre coleta transparente de dados e segmentação via IA.

**Oportunidade para LP Factory:**  
Destacar que nossas LPs já nascem **LGPD-ready**, com blocos de consentimento claros e **governança nativa** (audit logs, tokens) — indo além do discurso de campanhas.

---

## 2. Visão Estratégica LP

### 2.1 SSO Self-Service (Teams/Enterprise)
**UX:**  
Empresas dos planos avançados poderão configurar **Single Sign-On** diretamente no Dashboard, sem depender de suporte ou integrações externas.

**Valor:**  
Reduz atrito na ativação de clientes enterprise, permitindo uso autônomo de provedores corporativos (Google Workspace, Microsoft Azure AD, Okta).

**Posicionamento:**  
Recurso estratégico para planos **Ultra/White-label**, complementando a governança multi-tenant já prevista no Access Context.

---

### 2.2 Tokens Pessoais com Expiração
**UX:**  
Admins e desenvolvedores poderão criar tokens de acesso ao Supabase com prazo definido (ex.: 30/90 dias) diretamente no Dashboard.

**Valor:**  
Facilita governança em equipes e parceiros externos, permitindo acessos temporários para integrações, automações ou colaboradores terceirizados sem comprometer a segurança.

**Posicionamento:**  
Recurso estratégico para fases futuras com múltiplos devs/times, complementando a política de *secrets* e CI/CD já estabelecida no núcleo técnico.

---

### 2.3 Speed Insights (Performance em Produção)
**UX/Valor:**  
Monitorar **Core Web Vitals** (LCP, CLS, FID) com dados reais dos usuários em produção.

**Posicionamento:**  
Recurso opcional da Vercel, sem impacto em segurança/governança.

**Estratégia:**  
Ativar apenas pós-MVP, quando houver tráfego real de leads, para formar *baseline* de performance.

**Benefício:**  
Identificar gargalos de UX e otimizar experiência sem depender só de testes locais/laboratoriais.

---

### 2.4 Agent Experience (AX)
Projetar interfaces que **agentes de IA “entendam” ou naveguem melhor**, com endpoints, metadados e estrutura semântica que permitam operação automatizada sobre o produto com menos ajustes manuais.

---

### 2.5 Checklist + CI/ESLint (Governança Pós-MVP)
**Objetivo:**  
Transformar regras do MRVG em barreira automática (CI + lint), evitando violações de segurança e acesso direto ao DB.

**Valor:**  
Padroniza revisões, reduz retrabalho e garante consistência quando houver múltiplos devs/parceiros.

**Estratégia:**  
Ativar apenas pós-MVP, quando o core (LPs rápidas, integradas e dashboards) já estiver validado.

---

### 2.6 Conteúdo IA-ready + Smart Gating + AI Visibility (SEO 2.0 & LLMO)
Entrega futura de LPs preparadas para **Zero-Click/IA**, com suporte a FAQ, HowTo, Product e Article Schema, combinadas a um modelo híbrido de conteúdo (valor aberto para autoridade/alcance e ativos premium sob formulário).

**Diferencial:**  
Visibilidade sem clique em SERP/IA, confiança em escala e leads qualificados.  
A mensuração vai além do clique, incluindo impressões, SERP-features e citações em IAs (*AI Visibility*).

Inclui também princípios de **LLMO (Large Language Model Optimization)**: reforço de autoridade topical, credibilidade e conteúdo estruturado citável, garantindo que clientes do LP Factory sejam fontes reconhecidas por modelos de linguagem.

---

### 2.7 Estratégia de Lealdade Opt-in (Preferred Sources)
Ativar CTAs para que usuários adicionem a marca como **fonte preferida** (Google Preferred Sources, newsletters, etc.).

**Objetivo:**  
Garantir visibilidade personalizada mesmo em ambiente de buscas cada vez mais controladas pelo usuário.

---

### 2.8 Meta Ads – Value Rules, Smart Gating e Tracking Inteligente (2025)

#### Visão
As LPs do LP Factory 10 tornam-se sensores inteligentes que alimentam os algoritmos de mídia com dados de comportamento e valor real de lead.

#### 1. Tracking nativo
O sistema passa a medir visitas, cliques e envios via módulo `events_analytics` do Supabase, enriquecido com UTM e dados anônimos.

#### 2. Qualificação e scoring
Cada lead recebe score de intenção baseado em interações (tempo, profundidade, CTA), permitindo distinguir leads frios, mornos e quentes.

#### 3. Retroalimentação de campanhas
Eventos de conversão são enviados via Server-side Tracking API (Vercel Edge) para Google Ads e Meta Ads, melhorando o aprendizado e reduzindo custo por lead.

#### 4. Benefícios diretos
- Menor dependência de tags externas.
- Aprendizado automatizado em campanhas.
- LPs mais eficientes e autorreguladas.
- Base para pricing e relatórios consultivos.

### Status
🧪 **Experimental**

---

### 2.9 Google Ads: Text Guidelines (Beta) 🟢 Preparado
Novo recurso do Google Ads que permite definir **regras de redação para a IA** (tom, linguagem e palavras bloqueadas), garantindo consistência e conformidade da marca.  
Atualmente em beta, disponível apenas para campanhas em inglês.

**Impacto no projeto:**
- Mantém a voz e identidade das LPs em anúncios gerados por IA.  
- Reforça governança e padrões de mensagem por vertical.  
- Integra-se ao Roteiro → Conformidade Técnica (Guia de Texto).

**Ações:**
1. Criar “Guia de Texto da Marca” com tom, CTAs e termos proibidos.  
2. Aplicar em campanhas AI Max/PMax com “text customization” ativo.  
3. Monitorar rollout em português para ativação imediata.

---

### Última Atualização
**Data:** 05/11/2025  
**Próxima Revisão:** Trimestral ou quando concorrência mover.

## 3. Estratégias Futuras (2025‑2026)

### 3.1 Simplificação de UX no Account Dashboard 🪧 Ideia Inicial
**Objetivo:** Propor um layout de dashboard focado em métricas essenciais (leads, gastos e saúde das LPs) já na primeira dobra, antes de camadas complexas.
**Valor:** Reduz a carga cognitiva e melhora a adoção do produto, oferecendo contexto imediato e facilidade de navegação.

### 3.2 Estratégia de Verticais 2025 🪧 Ideia Inicial
**Objetivo:** Testar dois nichos por mês com LPs completas (copy, schema e analytics) para aprender e validar mercados promissores.
**Valor:** Gera ritmo de produção, coleta dados reais e identifica verticais com maior tração, guiando expansão.

### 3.3 Modelo Light da LP Factory 🪧 Ideia Inicial
**Objetivo:** Disponibilizar uma versão mais enxuta das landing pages, com menos seções dinâmicas, para pacotes de entrada e entregas rápidas.
**Valor:** Permite adesão rápida e acessível, reduz tempo de desenvolvimento e incentiva upgrades conforme o cliente evolui.

### 3.4 Ajuste entre Setup e Mensalidade 🪧 Ideia Inicial
**Objetivo:** Criar modelo híbrido de cobrança, combinando uma taxa inicial menor com componente variável baseada no sucesso do cliente.
**Valor:** Diminui a barreira de entrada e alinha incentivos, remunerando a agência conforme o desempenho e valor entregue.

### 3.5 Priorizar Reconhecimento nos Testes Iniciais 🪧 Ideia Inicial
**Objetivo:** Estruturar interfaces e roteiros de testes que priorizem ações visíveis e aprendizado por reconhecimento, evitando interfaces escondidas e o "mito dos 3 cliques".
**Valor:** Melhora a experiência nos primeiros usos, reduz atritos e aumenta a confiança do usuário ao evidenciar as possibilidades da plataforma.

### 3.6 Modelo de Pricing por Ação/Consumo 🪧 Ideia Inicial
**Objetivo:** Adotar cobrança baseada em uso (por ação ou consumo), como tokens processados ou geração de imagens, para ofertas de IA e automações.
**Valor:** Cria transparência e confiança, alinhando custos ao consumo real e garantindo que clientes paguem pelo que de fato utilizam.
