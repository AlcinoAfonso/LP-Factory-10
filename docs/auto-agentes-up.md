# LP Factory 10 — Agentes e Orquestração (Updates)

Este doc deve conter apenas updates do universo de agentes, tools, padrões de uso e orquestração que possam potencializar automações do projeto.

Isso inclui:
- recursos e padrões da OpenAI ligados a agentes
- handoffs, tool use, guardrails e arquitetura de agentes
- workflows, pipelines e orquestrações quando forem relevantes para automações assistidas por agentes ou para fluxos híbridos humano + agente + automação

Não inclui:
- CI, build, deploy e workflows técnicos gerais sem relação com agentes ou automações assistidas
- detalhes de infra de Supabase ou Vercel
- documentação operacional de automações em si, que deve ficar em `docs/automacoes.md`

Qualquer coisa de Supabase ou Vercel (infra, deploy, logs, MCP via Edge Functions etc.) fica nos respectivos docs e só referencia aqui se for governança de agentes, padrão de uso por agentes ou potencialização direta de automações assistidas.

---

## 1 — AgentKit *(🍿 Experimental)*
2025-11-12

### Descrição
Conjunto modular da OpenAI para criação e versionamento de agentes, integrando builder, registry e conectores MCP.

### Valor para o Projeto
- Base técnica para criação de agentes internos (LP Factory Bot, Benchmark Bot, DevOps Bot).
- Facilita orquestração de fluxos e rotinas.

### Valor para o Usuário
- Acelera tarefas repetitivas (pesquisas, relatórios, análises de logs).

### Ações Recomendadas
1. Definir agentes por domínio (Prod, Supabase, Estratégia).
2. Criar camada de autenticação e logs no Supabase.

---

## 2 — GPT Agents *(🍾 Estável)*
2025-11-13

### Descrição
Uso do GPT para execução de tarefas automatizadas (resumos, análises, geração de relatórios).

### Valor para o Projeto
- Centraliza automação de rotinas internas.
- Base para interação autônoma com GitHub, Supabase e Vercel.

### Valor para o Usuário
- Respostas rápidas e contextuais a partir de dados reais.

### Ações Recomendadas
1. Criar agentes por documento (Supabase Update, Estratégia, Benchmark).
2. Integrar via MCP e API interna.

---

## 3 — Passagens Eficazes entre Agentes (Handoff Design) *(🟣 Estável)*
2025-11-12

### Descrição
Modelo padronizado de handoff para transferência de contexto entre agentes IA, garantindo consistência e rastreabilidade em fluxos automatizados.

### Valor para o Projeto
- Define formato JSON universal (`goal`, `state`, `evidence`, `next`).
- Facilita depuração e coordenação entre múltiplos agentes GPT/Claude.

### Valor para o Usuário
- Interações de IA mais coerentes e contínuas.
- Redução de erros em automações interligadas.

### Ações Recomendadas
1. Adotar formato `handoff.json` no pipeline de agentes.
2. Integrar logs de handoff ao Supabase (Unified Logs).

---

## 4 — Agentes com Ferramentas em Pipelines Reais *(🍿 Experimental)*
2025-11-12

### Descrição
Integração de bots e agentes IA com CRMs e fluxos de marketing reais (ex.: HubSpot, Supabase MCP), permitindo automação ponta a ponta.

### Valor para o Projeto
- Conecta agentes do LP Factory 10 a dados reais via MCP.
- Automatiza tarefas de pesquisa e sincronização de leads.

### Valor para o Usuário
- Respostas mais rápidas, campanhas otimizadas e suporte proativo.

### Ações Recomendadas
1. Criar agente de integração CRM piloto (HubSpot / RD Station).
2. Logar execuções e métricas no Supabase para auditoria.

---

## 5 — Guia prático: Assistentes vs. Agentes *(🍾 Estável)*
2025-11-12

### Descrição
Define assistente (reativo, sob solicitação) versus agente (autonomia com metas, planejamento, ferramentas e navegação). Fornece panorama operacional para decidir entre modelos.

### Valor para o Projeto
- Vocabulário comum para processos e propostas.
- Base para escolher quando usar agente ou assistente.

### Valor para o Usuário
- Experiências previsíveis; evita autonomia indevida.

### Ações Recomendadas
1. Adotar glossário “assistente vs agente” no repositório.
2. Mapear onde cada um será aplicado (copy, pesquisa, PRs).

---

## 6 — Padrão Orquestrador‑Trabalhador *(🟣 Estável)*
2025-11-12

### Descrição
Arquitetura em que um orquestrador quebra metas e delega a trabalhadores (ferramentas especializadas). Lista falhas comuns: loops, deriva de autonomia, timeout, fragilidade de esquemas e erros de DOM.

### Valor para o Projeto
- Aumenta throughput em tarefas repetitivas (pesquisa, conteúdo, suporte).
- Orienta diagnóstico rápido de falhas.

### Valor para o Usuário
- Maior velocidade de entrega e consistência dos resultados.

### Ações Recomendadas
1. Registrar “Guide: OW-pattern” na pasta /docs.
2. Adicionar testes de loop/timeout no pipeline dos agentes.

---

## 7 — Tooling: AgentKit + Ecossistema *(🍿 Experimental)*
2025-11-12

### Descrição
“comparativo + critérios de decisão” (quando usar AgentKit, quando usar outro, riscos, etc.)

### Valor para o Projeto
- Padroniza versionamento, avaliação e observabilidade de agentes.
- Facilita embed de agentes no Dashboard.

### Valor para o Usuário
- Automação mais confiável e auditável.

### Ações Recomendadas
1. Prototipar um agente com AgentKit para pesquisa, draft e PR.
2. Medir latência, custo e qualidade versus fluxo atual.

---

## 8 — Segurança de Agentes: riscos e guardrails *(🍾 Estável)*
2025-11-12

### Descrição
Resume os principais riscos (prompt injection, autoexec sem revisão, escopo amplo) e melhores práticas: menor privilégio, sanitização de entradas, gateways, telemetria, replays e testes adversariais.

### Valor para o Projeto
- Reduz incidentes; aumenta rastreabilidade.

### Valor para o Usuário
- Menos erros e decisões indevidas do agente.

### Ações Recomendadas
1. Implementar testes de injeção a cada release.
2. Ativar replays e versionamento de prompts/config.

---

## 9 — Checklist Operacional de Agentes *(🍾 Estável)*
2025-11-12

### Descrição
Checklist em 5 frentes para operar agentes: Risco/Regulação, Catálogo de Ferramentas, Telemetria/Avaliação, Handoffs humanos e Rollback/mode degradado.

### Valor para o Projeto
- Opera agentes com controles claros e auditáveis.

### Valor para o Usuário
- Handoffs transparentes e recuperação segura.

### Ações Recomendadas
1. Anexar checklist ao PR template de novos agentes.
2. Criar feature flags por agente/ferramenta.

---

## 10 — Roadmap de Adoção (Fase 1→3) *(🍾 Estável)*
2025-11-12

### Descrição
Define fases evolutivas: Fase 1 (assistente reativo), Fase 2 (agente com metas curtas e gate humano) e Fase 3 (produção com AgentKit, versionamento, avaliação e UI embarcada).

### Valor para o Projeto
- Trajeto claro de risco baixo até produção.

### Valor para o Usuário
- Ganhos progressivos sem perda de controle.

### Ações Recomendadas
1. Abrir board Kanban (Done/Next/Blocked) das fases.
2. Definir SLAs e métricas por fase.

---

## 11 — Trio de Segurança p/ Agentes: RLS + Tokens Curtos + Auditoria *(🍾 Estável)*
2025-11-12

### Descrição
Fluxo fim‑a‑fim combinando RLS por `account_id`, JWT de curta expiração com `role=agent` e `scope` mínimo e logs imutáveis (`audit_logs`) para cada chamada.

### Valor para o Projeto
- Isolamento por conta, janela de risco pequena e rastros imutáveis.

### Valor para o Usuário
- Confiabilidade e governança nas ações do agente.

### Ações Recomendadas
1. Emitir tokens via Edge Function e validar `scope` no handler.
2. Registrar pré e pós execução no `audit_logs` com `request_id`.

---

## 12 — Assistente de Metadados de LP *(🧪 Experimental)*
2025-11-17

### Descrição
Assistente contextual no Dashboard que sugere automaticamente título, slug, segmento e objetivo de uma nova Landing Page com base no contexto da conta e no histórico. Integrado via AgentKit/ChatKit no front‑end (Next.js), permite aplicar as sugestões ao formulário com um clique.

### Valor para o Projeto
- Demonstra aplicação prática do AgentKit no produto e valida o fluxo agente ↔ UI com RLS/grants.
- Cria base para futuras automações (herói copy, seções padrão, FAQs) ligadas à criação de LPs.
- Ajuda a alinhar a visão de “Agent Experience (AX)” com uma feature tangível.

### Valor para o Usuário
- Reduz tempo na criação de LPs ao pré‑preencher metadados coerentes com o segmento e meta da conta.
- Garante consistência nos nomes e objetivos das LPs, evitando erros manuais.
- Permite experimentar IA de forma não intrusiva, com possibilidade de revisão antes de aplicar.

### Ações Recomendadas
1. Criar endpoint `/api/ai/guess-lp-metadata` via adapter, validando sessão e `account_id`.
2. Embutir componente `AssistantPanel` nas telas de criação/edição de LP.
3. Registrar a tool `guess_lp_metadata` no AgentKit e auditar chamadas (gravar `agent_id`, tool e `account_id`).
4. Habilitar a feature apenas para contas internas ou via flag `ai_lp_metadata_assistant` até validar o MVP.

---
