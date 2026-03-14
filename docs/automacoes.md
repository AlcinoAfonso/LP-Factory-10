Automações — LP Factory 10
0.1 Cabeçalho

• Data: 14/03/2026
• Versão: v1.4
• Status: Estrutura consolidada

0.2 Função do documento

• Este documento registra a camada de automações e integrações operacionais do LP Factory 10.
• Atua como referência para pipelines, agentes, integrações e automações do sistema.
• Outros documentos devem preferencialmente referenciar este arquivo quando tratarem de automações.

0.3 Relação com outros documentos

Este documento complementa:

docs/base-tecnica.md

• arquitetura técnica do sistema
• regras estruturais

docs/schema.md

• estrutura de banco
• tabelas, views, policies e functions

docs/roadmap.md

• evolução funcional do produto

1. Escopo da camada de automação
1.1 Objetivo

Registrar e documentar:

• automações do sistema
• pipelines operacionais
• integrações entre plataformas
• agentes experimentais
• credenciais estruturais usadas em automações
• aprendizados operacionais

1.2 Inclui

• pipelines CI/CD
• automações de inspeção
• automações documentais
• integrações com OpenAI
• integrações com Supabase
• integrações com Vercel
• integrações com serviços externos

1.3 Não inclui

• segredos ou chaves reais
• lógica de produto
• estrutura de banco detalhada
• regras de UX ou marketing

2. Regras do documento
2.1 Regra de segurança

Segredos nunca devem ser registrados neste documento.

Registrar apenas:

• nome da credencial
• plataforma
• ambiente
• localização do segredo
• finalidade

2.2 Origem das informações

Informações podem vir de duas fontes.

2.2.1 Base repositório

Dados sustentados por arquivos versionados.

Exemplos:

• workflows
• scripts
• pipelines
• migrations
• documentos

2.2.2 Observação operacional

Dados observados em execução real ou dashboards.

Exemplos:

• billing
• usage
• limites
• estado de integração
• testes operacionais

3. Arquitetura de automação
3.1 Modelo conceitual

A camada de automação segue um modelo típico de sistemas agentic.

Human
↓
Agent
↓
Tools
↓
Systems

3.2 Papel dos agentes

Agentes atuam como orquestradores de tarefas.

Responsabilidades:

• interpretar instruções
• decidir ferramentas a usar
• executar etapas do fluxo
• consolidar resultados

3.3 Papel das ferramentas

Ferramentas executam operações reais.

Exemplos:

• pipelines
• consultas SQL
• scripts
• chamadas de API

3.4 Integração Builder + SDK

Diretriz atual do projeto.

Builder

• prototipação rápida
• aprendizado
• validação inicial de fluxos

SDK / backend

• execução real
• integração com pipelines
• integração com banco
• operação do sistema

4. Plataformas
4.1 OpenAI
4.1.1 Papel na automação

• execução de modelos
• integração com pipelines
• Agent Builder
• Agents SDK
• tool calling
• experimentos com agentes

4.1.2 Ambientes

• LPF10-DEV
• LPF10-PROD

4.1.3 Credenciais registradas

OPENAI_API_KEY

• plataforma: OpenAI
• armazenamento: GitHub Secrets
• uso: pipelines e automações que executam modelos

Origem: Base repositório

4.1.4 Integrações existentes

OpenAI ↔ GitHub

Pipelines:

• openai-smoke
• supabase-inspect

Origem: Base repositório

4.1.5 Monitoramento operacional

Observações registradas:

• credit grant: $10
• saldo observado: $9.94
• consumo: $0.06
• expiração: 28/02/2027
• budget configurado: $10
• alertas: 80% e 100%
• auto recharge: desligado

Origem: Observação operacional

4.1.6 Capacidades relevantes da plataforma

Modelos recentes suportam:

• contexto grande (dependendo do modelo)
• tool calling
• seleção automática de ferramentas
• custom tools
• workflows multi-etapas
• execução iterativa de tarefas

Esses recursos representam capacidades da plataforma, não necessariamente implementações já existentes no projeto.

4.2 GitHub
4.2.1 Papel na automação

• repositório principal
• GitHub Actions
• execução de pipelines
• armazenamento de secrets

4.2.2 Credenciais utilizadas

OPENAI_API_KEY

• origem: OpenAI
• uso: execução de modelos em pipelines

SUPABASE_DB_URL_READONLY

• origem: Supabase
• uso: inspeção read-only do banco

4.2.3 Workflows identificados

.github/workflows/openai-smoke.yml

.github/workflows/pipeline-supabase-inspect.yml

.github/workflows/pipeline-docs-apply-report.yml

.github/workflows/security.yml

.github/workflows/upgrade-next-16-1-1.yml

Origem: Base repositório

4.3 Supabase
4.3.1 Papel na automação

• banco de dados
• autenticação
• fonte de dados para inspeções

4.3.2 Credenciais registradas

SUPABASE_DB_URL_READONLY

• armazenamento: GitHub Secrets
• finalidade: inspeção read-only

4.3.3 Role utilizada

ai_readonly

Permissões:

• login permitido
• statement timeout: 5s
• acesso SELECT no schema public

Migration relacionada:

supabase/migrations/0005__ai_readonly.sql

Origem: Base repositório

4.4 Vercel
4.4.1 Papel na automação

• deploy do sistema
• integração com GitHub
• execução de builds

4.4.2 Observações

• build validado via integração GitHub → Vercel
• possível integração futura com Vercel AI Gateway

4.5 Resend
4.5.1 Papel na automação

• envio de e-mails transacionais

4.5.2 Situação atual

• domínio validado
• integração SMTP ativa com Supabase Auth

Origem: Observação operacional

5. Catálogo de automações
5.1 Estrutura de registro

Cada automação registra:

• nome
• data
• tipo
• objetivo
• plataformas
• entrada
• saída
• credenciais
• arquivos
• status

Status possíveis:

• implementada
• em implementação
• experimental
• prevista
• descontinuada

As automações devem ser registradas em ordem cronológica de criação.

5.2 Automação 001 — OpenAI smoke
5.2.1 Data

02/03/2026

5.2.2 Tipo

pipeline

5.2.3 Objetivo

Validar integração mínima entre OpenAI e GitHub Actions.

5.2.4 Plataformas

• OpenAI
• GitHub

5.2.5 Entrada

execução manual do workflow

5.2.6 Saída

resposta do endpoint /v1/models

5.2.7 Credenciais

OPENAI_API_KEY

5.2.8 Arquivo

.github/workflows/openai-smoke.yml

5.2.9 Status

implementada

5.3 Automação 002 — Supabase Inspect
5.3.1 Data

03/03/2026

5.3.2 Tipo

pipeline

5.3.3 Objetivo

Executar consultas SQL read-only no Supabase via GitHub Actions.

5.3.4 Plataformas

• GitHub
• OpenAI
• Supabase

5.3.5 Entrada

• briefing
• briefing_path
• openai_model

5.3.6 Saída

• plano de execução
• queries executadas
• resultados
• relatório no Job Summary

5.3.7 Credenciais

• OPENAI_API_KEY
• SUPABASE_DB_URL_READONLY

5.3.8 Arquivos

.github/workflows/pipeline-supabase-inspect.yml
pipelines/supabase-inspect/run.mjs
pipelines/supabase-inspect/README.md

5.3.9 Status

implementada

5.4 Automação 003 — Supabase Inspect batch
5.4.1 Data

06/03/2026

5.4.2 Tipo

evolução de pipeline

5.4.3 Objetivo

Executar múltiplas queries SQL read-only.

5.4.4 Entrada

queries separadas por ---

5.4.5 Saída

relatório completo por query

5.4.6 Status

implementada

6. Aprendizados operacionais
6.1 Princípios

• integração técnica não garante utilidade real
• automações devem reduzir trabalho humano
• agentes devem filtrar, resumir e priorizar informação

6.2 Modelos como orquestradores

Modelos coordenam tarefas.

Ferramentas executam operações reais.

6.3 Fluxos multi-etapas

Estrutura recorrente:

Agent
↓
Tools
↓
Systems

6.4 Segurança operacional

• preferir menor privilégio
• automações de banco devem usar roles read-only

7. Decisões registradas

• docs/automacoes.md é a fonte oficial do tema automações
• automações são registradas em ordem cronológica
• dados operacionais podem ser registrados como observação operacional quando não estiverem no repositório
