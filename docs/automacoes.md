0.1 Cabeçalho
Data: 14/03/2026
Versão: v1.6
Status: Estrutura revisada

0.2 Função do documento
Este documento registra a camada de automação do LP Factory 10.
Este documento é a fonte oficial do tema automações no projeto.
Os demais documentos devem preferencialmente referenciar este arquivo quando tratarem de automações, pipelines, agentes, integrações operacionais e credenciais usadas por automações.
O objetivo é reduzir redundância e evitar drift documental.

0.3 Relação com outros documentos
docs/base-tecnica.md: regras estruturais gerais do sistema.
docs/schema.md: estrutura de banco, tabelas, views, policies e functions.
docs/roadmap.md: evolução funcional do produto.

1. Objetivo e escopo
1.1 Objetivo
Registrar a camada de automação do LP Factory 10.
Consolidar conhecimento operacional sobre plataformas, integrações e automações.
Preservar decisões técnicas e aprendizados obtidos durante a implementação.

1.2 O que este documento cobre
Plataformas utilizadas pela camada de automação.
Estrutura global de integrações entre plataformas.
Registro estrutural de credenciais, sem valores secretos.
Catálogo de automações do sistema.
Registro de validações e checks automatizados relevantes para a camada operacional.
Aprendizados operacionais obtidos durante implementações.

1.3 O que este documento não cobre
Valores brutos de chaves ou tokens.
Contrato detalhado de banco, tabelas, views, policies e functions, documentados em docs/schema.md.
Regras estruturais gerais do sistema que não sejam específicas da camada de automação, documentadas em docs/base-tecnica.md.
Roadmap funcional do produto, documentado em docs/roadmap.md.

1.4 Regra de segurança
Nunca registrar segredos brutos neste documento.
Registrar apenas:
nome da credencial
plataforma
ambiente
localização do segredo
finalidade
escopo

1.5 Regra de origem da informação
1.5.1 Base repositório
Informação sustentada por arquivos versionados no repositório.
Exemplos:
workflows
scripts
pipelines
migrations
README técnicos
documentos versionados

1.5.2 Observação operacional
Informação observada em execução real do sistema ou em painéis das plataformas.
Exemplos:
estado de chaves
billing
usage
limites observados
testes manuais
resultados de integração

2. Plataformas e configuração global
2.1 OpenAI
2.1.1 Papel na automação
Agent Builder
Agents SDK
Functions
MCP
execução de modelos
integração com pipelines e automações

2.1.2 Ambientes
Project: LPF10-DEV
Project: LPF10-PROD

2.1.3 Credenciais registradas
OPENAI_API_KEY
Plataforma: OpenAI
Ambiente operacional prioritário: DEV
Armazenamento: GitHub Secrets
Uso atual: automações e pipelines que chamam modelos
Origem do registro: Base repositório
Key de projeto observada:
nome: lpf10-dev-sdk
projeto: LPF10-DEV
status observado: ativa
último uso observado: 06/03/2026
Origem do registro: Observação operacional

2.1.4 Integrações existentes
OpenAI ↔ GitHub
mecanismo: GitHub Actions utilizando OPENAI_API_KEY
uso atual:
pipeline openai-smoke
pipeline supabase-inspect
Origem do registro: Base repositório

2.1.5 Governança mínima registrada
Projects registrados:
LPF10-DEV
LPF10-PROD
Sharing registrado:
habilitado apenas para projetos selecionados, com LPF10-DEV selecionado
Service Account registrada:
criada no LPF10-DEV
Higiene de keys registrada:
manter apenas keys necessárias ativas
revogar imediatamente keys expostas ou indevidas
Estado final reportado no setup mínimo:
1 key ativa no LPF10-DEV

2.1.6 Monitoramento operacional
Credit grant organizacional observado: $10.00
Saldo observado: $9.94
Consumo observado até o momento: $0.06
Data de recebimento observada: 31/01/2026
Expiração observada: 28/02/2027
Budget organizacional observado: $10
Alertas observados: 80% e 100%
Auto recharge observado: desligado
Forma de pagamento cadastrada: sim
Origem do registro: Observação operacional

2.1.7 Diretriz de uso de chaves e contexto
Sempre que possível, utilizar a key operacional do contexto correto de desenvolvimento e automação.
O objetivo é manter rastreabilidade do uso no projeto operacional esperado.
Não inferir que toda bonificação está vinculada automaticamente a um projeto específico apenas porque a key principal está nele.
Quando houver dúvida sobre onde ocorreu o consumo, validar no painel de Usage com filtro por projeto.

2.1.8 Diretriz de custo por modelo
Preferir modelos mais baratos quando a tarefa permitir.
Usar modelos mais recentes ou mais caros apenas quando houver necessidade real de complexidade, qualidade ou assertividade.
Essa avaliação deve ser feita automação por automação.

2.1.9 Capacidades relevantes para automação
Modelos recentes suportam contexto grande, com limite variável por modelo.
Isso permite analisar:
repositórios extensos
documentação longa
logs
outputs de pipelines
Modelos podem chamar ferramentas externas configuradas pelo desenvolvedor.
Ferramentas podem incluir:
APIs
funções backend
pipelines
scripts
inspeção de banco
Quando várias tools estão registradas, o modelo pode selecionar automaticamente a mais adequada.
O sistema pode definir custom tools próprias.
Alguns modelos suportam execução iterativa de tarefas computacionais.
Esses recursos devem ser tratados como capacidades da plataforma, não como tudo já implementado no projeto.

2.1.10 Diretriz Builder + SDK
Builder:
prototipação rápida
experimentação
validação inicial de fluxos
aprendizado da plataforma
SDK / integração backend:
execução operacional
integração com tools, APIs e pipelines
integração com banco
orquestração principal do sistema
Diretriz atual do projeto:
Builder como camada de aprendizado e protótipo
SDK como direção mais sólida para a automação principal

2.1.11 Observações operacionais
Agent Builder disponibiliza templates nativos.
Templates identificados:
Data enrichment
Planning helper
Customer service
Structured Data Q/A
Document comparison
Internal knowledge assistant
O consumo de tokens pode ser acompanhado no Usage da organização, com filtro por projeto, e também programaticamente nas respostas da API quando necessário.
Origem do registro: Observação operacional

2.2 GitHub
2.2.1 Papel na automação
repositório principal
GitHub Actions
execução de pipelines
armazenamento de secrets
suporte a automações que criam branch, commit e PR

2.2.2 Credenciais registradas
OPENAI_API_KEY
origem: OpenAI
uso: pipelines que executam chamadas de modelo
Origem do registro: Base repositório
SUPABASE_DB_URL_READONLY
origem: Supabase
uso: pipeline de inspeção read-only
Origem do registro: Base repositório

2.2.3 Integrações existentes
GitHub ↔ OpenAI
openai-smoke
supabase-inspect
GitHub ↔ Supabase
supabase-inspect
GitHub ↔ documentação do repositório
pipeline-docs-apply-report

2.2.4 Estrutura operacional
Workflows em .github/workflows
Pipelines versionados no repositório em pipelines/
Workflows identificados no zip 64:
.github/workflows/openai-smoke.yml
.github/workflows/pipeline-supabase-inspect.yml
.github/workflows/pipeline-docs-apply-report.yml
.github/workflows/security.yml
.github/workflows/upgrade-next-16-1-1.yml

2.3 Supabase
2.3.1 Papel na automação
banco de dados
Auth
fonte de dados para inspeções automatizadas
base para roles e grants de leitura restrita usados por automações

2.3.2 Credenciais registradas
SUPABASE_DB_URL_READONLY
Plataforma: Supabase
Ambiente operacional atual: automações via GitHub Actions
Armazenamento: GitHub Secrets
Finalidade: permitir inspeção read-only do banco pelo pipeline supabase-inspect
Escopo: role/usuário read-only
Origem do registro: Base repositório

2.3.3 Estrutura atual
Role ai_readonly registrada:
login permitido
statement_timeout: 5s
USAGE no schema public
GRANT SELECT nas tabelas existentes em public
default privileges para novas tabelas em public com GRANT SELECT
Migration relacionada:
supabase/migrations/0005__ai_readonly.sql
Origem do registro: Base repositório

2.3.4 Observações
Pipeline atual executa apenas SQL read-only.
Discovery pode usar information_schema e pg_catalog.
O escopo operacional documentado para a role é leitura no schema public.
Origem do registro: Base repositório

2.4 Vercel
2.4.1 Papel na automação
deploy do sistema
integração com GitHub
observabilidade

2.4.2 Observações
Build validado externamente via CI/Vercel.
Diretriz registrada no roadmap: uso do Vercel AI Gateway para integrações IA.

2.5 Resend
2.5.1 Papel na automação
suporte ao e-mail transacional do Supabase Auth

2.5.2 Situação atual
domínio validado
integração SMTP com Supabase Auth ativa
Origem do registro: Observação operacional

3. Catálogo de automações
   
3.1 Estrutura padrão de registro
Cada automação deve registrar:
nome
data de criação
tipo
objetivo
plataformas envolvidas
entrada
saída
credenciais utilizadas
arquivos e caminhos relevantes
automações relacionadas
status
fonte do registro
observações
Status possíveis:
implementada
em implementação
experimental
prevista
descontinuada
As automações devem ser registradas em ordem de criação.

3.2 Automação 001 — OpenAI setup mínimo + smoke no GitHub
3.2.1 Data de criação
02/03/2026

3.2.2 Tipo
setup operacional + workflow de validação mínima

3.2.3 Objetivo
Concluir o setup mínimo de OpenAI Projects para DEV/PROD.
Validar integração mínima entre OpenAI e GitHub Actions.
Confirmar que a key operacional está funcional no repositório.

3.2.4 Plataformas envolvidas
OpenAI
GitHub

3.2.5 Entrada
execução manual do workflow openai-smoke
presença do secret OPENAI_API_KEY

3.2.6 Saída
resposta do endpoint /v1/models em log do GitHub Action

3.2.7 Credenciais utilizadas
OPENAI_API_KEY

3.2.8 Arquivos e caminhos relevantes
.github/workflows/openai-smoke.yml
docs/base-tecnica.md
docs/roadmap.md

3.2.9 Automações relacionadas
supabase-inspect

3.2.10 Status
implementada

3.2.11 Fonte do registro
Base repositório
Observação operacional

3.2.12 Observações
O workflow openai-smoke faz chamada real à OpenAI via curl.
O ajuste de remover head no pipeline foi registrado para evitar falha SIGPIPE.
Esta automação representa o ponto mínimo de validação OpenAI ↔ GitHub.

3.3 Automação 002 — Supabase Inspect
3.3.1 Data de criação
03/03/2026

3.3.2 Tipo
pipeline

3.3.3 Objetivo
Executar inspeções read-only no Supabase via GitHub Actions.
Permitir investigação controlada do banco sem mutação.
Retornar resultado apenas em logs e Job Summary.

3.3.4 Plataformas envolvidas
GitHub
OpenAI
Supabase

3.3.5 Entrada
briefing opcional
briefing_path opcional
openai_model opcional
execução manual do workflow Pipeline Supabase — Inspect

3.3.6 Saída
plano e decisões do modelo nos logs
queries executadas
amostras e resumo dos resultados
conclusão e recomendações
lista compacta das queries no Job Summary
relatório final no Job Summary

3.3.7 Credenciais utilizadas
OPENAI_API_KEY
SUPABASE_DB_URL_READONLY

3.3.8 Arquivos e caminhos relevantes
.github/workflows/pipeline-supabase-inspect.yml
pipelines/supabase-inspect/run.mjs
pipelines/supabase-inspect/README.md
pipelines/supabase-inspect/PREMERGE_CHECK.md
pipelines/supabase-inspect/templates/.gitkeep
supabase/migrations/0005__ai_readonly.sql
docs/base-tecnica.md
docs/schema.md
docs/roadmap.md

3.3.9 Automações relacionadas
OpenAI setup mínimo + smoke
Role ai_readonly
possível uso futuro por agentes e functions de investigação do sistema

3.3.10 Status
implementada

3.3.11 Fonte do registro
Base repositório

3.3.12 Observações
Objetivo v1 registrado: inspeção read-only no Supabase via GitHub Actions.
Guardrails registrados:
proíbe ;
SQL deve iniciar com WITH ou SELECT
LIMIT obrigatório
se o LIMIT for literal, deve ser <= 50
denylist de mutações e comandos proibidos
Limites registrados:
max_queries = 20
max_rows = 50
truncagem 200 chars/célula
truncagem 10k chars/query
Dependências instaladas em runtime:
openai
pg
Escopo documentado:
role ai_readonly
schema public
discovery com information_schema e pg_catalog
O workflow usa permissions: contents: read.
O workflow usa concurrency por branch/ref.

3.4 Automação 003 — Supabase Inspect batch SQL + relatório completo
3.4.1 Data de criação
06/03/2026

3.4.2 Tipo
evolução funcional do pipeline supabase-inspect

3.4.3 Objetivo
Permitir múltiplas queries SQL read-only em modo determinístico.
Entregar relatório completo por query no Job Summary.

3.4.4 Plataformas envolvidas
GitHub
OpenAI
Supabase

3.4.5 Entrada
múltiplas queries no campo briefing
ou múltiplas queries em arquivo apontado por briefing_path
delimitador suportado: ---

3.4.6 Saída
execução em ordem das queries
Summary com SQL, rowCount, columns e sample de rows por query
relatório completo por query no Job Summary

3.4.7 Credenciais utilizadas
OPENAI_API_KEY
SUPABASE_DB_URL_READONLY

3.4.8 Arquivos e caminhos relevantes
.github/workflows/pipeline-supabase-inspect.yml
pipelines/supabase-inspect/README.md
docs/base-tecnica.md
docs/roadmap.md

3.4.9 Automações relacionadas
Supabase Inspect

3.4.10 Status
implementada

3.4.11 Fonte do registro
Base repositório

3.4.12 Observações
O delimitador --- é suportado:
em linha própria
inline, na mesma linha, com espaços ao redor
As regras read-only continuam válidas no modo batch.
O README registra templates/ como slot para:
briefings de exemplo
outputs esperados
SQL samples readonly

3.5 Automação 004 — Pipeline Docs Apply Report
3.5.1 Data de criação
data específica não explicitada no conteúdo inspecionado do zip 64

3.5.2 Tipo
pipeline de aplicação de report documental com criação automática de PR

3.5.3 Objetivo
Aplicar reports JSON Actions-ready em arquivos Markdown do repositório.
Automatizar a criação de branch, commit e Pull Request para revisão humana.

3.5.4 Plataformas envolvidas
GitHub

3.5.5 Entrada
report_path obrigatório no workflow
arquivo JSON Actions-ready existente no repo

3.5.6 Saída
aplicação automática do report
branch automática
commit automático
Pull Request automático
resumo no Job Summary

3.5.7 Credenciais utilizadas
permissões do GitHub Actions

3.5.8 Arquivos e caminhos relevantes
.github/workflows/pipeline-docs-apply-report.yml
pipelines/docs-apply-report/run.mjs
pipelines/docs-apply-report/apply-doc-report.mjs
docs/repo-inv.md

3.5.9 Automações relacionadas
fluxo documental do projeto
reports JSON Actions-ready
revisão humana via PR

3.5.10 Status
implementada

3.5.11 Fonte do registro
Base repositório

3.5.12 Observações
O workflow usa:
permissions: contents: write
permissions: pull-requests: write
O PR é criado automaticamente com labels:
docs
automation
needs-review
O executor do report suporta, no mínimo:
replace_section
insert_after_section
insert_after_heading
Regras registradas no executor:
fail-fast
erro em âncora ausente
erro em alvo ausente
erro em match ambíguo
erro quando a seção já existe em caso de insert

3.6 Automação 005 — Security Checks
3.6.1 Data de criação
data específica não explicitada no conteúdo inspecionado do zip 64

3.6.2 Tipo
workflow de validação de segurança em PR

3.6.3 Objetivo
Bloquear padrões proibidos de implicit flow no client/UI.
Impedir uso indevido de tokens, setSession, getSessionFromUrl e verifyOtp fora dos locais permitidos.

3.6.4 Plataformas envolvidas
GitHub

3.6.5 Entrada
abertura de Pull Request para branches main ou macro

3.6.6 Saída
aprovação ou falha do job no-implicit-flow

3.6.7 Credenciais utilizadas
nenhuma credencial específica registrada

3.6.8 Arquivos e caminhos relevantes
.github/workflows/security.yml
app/auth/confirm/
docs/repo-inv.md

3.6.9 Automações relacionadas
checks determinísticos no sandbox

3.6.10 Status
implementada

3.6.11 Fonte do registro
Base repositório

3.6.12 Observações
O workflow procura ofensores em src/ e app/.
Exceção registrada:
app/auth/confirm/ pode conter o handler server-side permitido
Regras principais:
bloquear access_token
bloquear refresh_token
bloquear setSession(
bloquear getSessionFromUrl(
verifyOtp( só pode aparecer em app/auth/confirm/

3.7 Automação 006 — Upgrade Next.js to 16.1.1
3.7.1 Data de criação
data específica não explicitada no conteúdo inspecionado do zip 64

3.7.2 Tipo
workflow de manutenção automatizada

3.7.3 Objetivo
Atualizar next e eslint-config-next para a versão informada.
Garantir lockfile canônico versionado.
Fazer commit e push automáticos quando houver mudança.

3.7.4 Plataformas envolvidas
GitHub

3.7.5 Entrada
target_branch
next_version
execução manual do workflow

3.7.6 Saída
instalação de dependências
atualização de versão
lint não bloqueante
build bloqueante
commit e push automáticos, se houver alteração

3.7.7 Credenciais utilizadas
permissões de escrita no repositório via GitHub Actions

3.7.8 Arquivos e caminhos relevantes
.github/workflows/upgrade-next-16-1-1.yml
docs/base-tecnica.md
package.json
package-lock.json

3.7.9 Automações relacionadas
checks determinísticos no sandbox

3.7.10 Status
implementada

3.7.11 Fonte do registro
Base repositório

3.7.12 Observações
Node.js configurado no workflow: 22
Regra operacional registrada:
se existir package-lock.json, usar instalação reprodutível
se não existir, gerar lockfile
npm run lint --if-present || true
lint é não bloqueante
npm run build --if-present
build é bloqueante
Faz commit e push apenas se houver mudanças detectadas

3.8 Automação 007 — Agente experimental de aprendizado
3.8.1 Data de criação
2026

3.8.2 Tipo
Agent Builder

3.8.3 Objetivo
Explorar integração com ferramentas externas e fluxo de aprovação de tools.
Servir como laboratório de aprendizado da plataforma Builder Agent.

3.8.4 Plataformas envolvidas
OpenAI

3.8.5 Entrada
comandos do usuário no Agent Builder

3.8.6 Saída
resposta do agente
possível execução de tool externa
aprendizado operacional sobre limites, UX, integração e utilidade

3.8.7 Credenciais utilizadas
variável conforme tool integrada

3.8.8 Arquivos e caminhos relevantes
nenhum arquivo operacional versionado identificado no repo para este agente experimental
referência temática complementar:
docs/auto-agentes-up.md

3.8.9 Automações relacionadas
ecossistema OpenAI
aprendizados sobre Agent Builder, MCP, tools e prototipação

3.8.10 Status
experimental

3.8.11 Fonte do registro
Observação operacional
referência temática complementar em Base repositório

3.8.12 Observações
Agente criado principalmente para aprendizado da plataforma.
Nem todo agente experimental precisa virar automação ativa.
Pode ser descontinuado após a extração do aprendizado operacional.

3.9 Automação 008 — Supabase Inspect Agent
3.9.1 Data de criação
14/03/2026

3.9.2 Tipo
Agent Builder

3.9.3 Objetivo
Realizar inspeções read-only estruturadas no Supabase.
Operar com briefing externo.
Utilizar tool server-side no app.
Entregar outputs organizados.
Não utilizar GitHub no runtime.
Não executar qualquer ação de escrita.

3.9.4 Plataformas envolvidas
OpenAI
Supabase

3.9.5 Status
em implementação

3.9.6 Fonte do registro
Observação operacional

3.9.7 Observações
Base oficial do agente criada no Agent Builder.
Workflow criado no Agent Builder.
Node Agent criado.
Nome do agente definido.
Instruções do agente definidas.
Agente publicado com sucesso.
Nome registrado: Supabase Inspect Agent
Status observado no Builder: Live
Workflow ID: wf_69b57fed963c8190b9da8e40797aa5820147027ff7bd60d7
URL: https://platform.openai.com/agent-builder/edit?workflow=wf_69b57fed963c8190b9da8e40797aa5820147027ff7bd60d7&version=1


4. Aprendizados operacionais
4.1 Princípios identificados
Integração entre plataformas não significa utilidade real.
Automações devem reduzir trabalho humano.
Agentes úteis geralmente filtram, resumem, priorizam ou alertam.

4.2 Templates do Agent Builder
Antes de criar um agente do zero, verificar a aba Templates do Agent Builder.
Os templates devem ser tratados como arquétipos de automação, não apenas exemplos visuais.
Templates identificados na plataforma:
Data enrichment
Planning helper
Customer service
Structured Data Q/A
Document comparison
Internal knowledge assistant

4.3 Uso prático do Agent Builder
O Agent Builder é adequado para:
aprendizado rápido
prototipação
validação de fluxos
teste de integrações
O Agent Builder não deve ser assumido automaticamente como a melhor camada para a automação principal do projeto.

4.4 Integração versus utilidade
Um agente pode funcionar tecnicamente e ainda assim não gerar valor prático.
A utilidade real aparece quando o agente:
filtra informação
prioriza o que importa
resume conteúdo
reduz carga cognitiva
entrega ação útil

4.5 MCP e conectores externos
MCP é útil para validar conexão entre plataformas.
MCP pode introduzir atritos com:
autenticação
permissões
tokens temporários
UX confusa de conexão
Para o núcleo do LP Factory, Functions e Agent SDK tendem a ser caminhos mais sólidos.

4.6 Critério para o primeiro agente útil
O primeiro agente útil deve ter:
uma função concreta
ganho prático claro
baixa complexidade
Evitar agentes que apenas reproduzam consultas simples que o usuário faz mais rápido manualmente.

4.7 Teste operacional no Builder
No workflow do Agent Builder, Evaluate abre traces.
O teste operacional do nó ocorre por Run no agente.
Esse comportamento deve ser lembrado para evitar confusão em novos testes.

4.8 Agentes experimentais
Agentes experimentais podem ser criados apenas para aprendizado.
Nem todo agente experimental precisa virar automação ativa.
Agentes experimentais podem ser descontinuados após a extração do aprendizado operacional.

4.9 Crédito, consumo e chave operacional
Crédito/bonificação e consumo de tokens são controles diferentes.
O crédito deve ser monitorado no Billing.
O consumo deve ser monitorado no Usage.
Sempre que possível, utilizar a key operacional do contexto correto para preservar rastreabilidade.
Não concluir onde houve gasto sem filtrar o Usage por projeto.
Projeto com key ativa não implica, por si só, que todo consumo ou toda bonificação pertença exclusivamente a ele.

4.10 Diretriz de custo por modelo

Modelos mais baratos devem ser a escolha padrão quando a tarefa permitir.
Modelos mais caros ou mais recentes devem ser usados apenas quando houver justificativa de complexidade, qualidade ou assertividade.
O custo deve ser avaliado por automação, e não apenas de forma genérica no projeto.

4.11 Princípios de segurança e menor privilégio
Sempre que possível, automações devem operar com permissão mínima.
Em acesso a banco, preferir role read-only quando o objetivo for inspeção.
Em GitHub Actions, registrar apenas os secrets realmente necessários.
Em agents e integrações externas, evitar escopo amplo sem necessidade.

4.12 Validação e rastreabilidade
Workflows e pipelines devem deixar rastro suficiente para diagnóstico.
Quando possível, preferir logs e Job Summary claros a execuções opacas.
Em automações de documentação, manter revisão humana via PR continua sendo desejável.

4.13 Aprendizado operacional — Supabase Inspect Agent (tentativa malsucedida)
A tentativa de implementação do Supabase Inspect Agent gerou ROI negativo.
O problema principal não foi falta de esforço, e sim expansão de arquitetura antes da prova mínima do fluxo.
Foram criadas múltiplas camadas — Builder, ChatKit session, frontend lab, rota intermediária, tool route, adapter server-side e OpenAPI — sem evidência suficiente de chamada real da tool com output útil.
Regra consolidada: em casos de integração com agentes, primeiro provar o fluxo mínimo ponta a ponta com request real, resposta real, log real e output real. Só depois expandir UI, sessão, rotas adicionais, adapters ou refactors.
Regra adicional: toda criação de arquivo novo deve justificar explicitamente qual hipótese está sendo validada.

5. Decisões registradas
5.1 Decisões
docs/automacoes.md é a fonte oficial do tema automações.
Automações devem ser registradas em ordem de criação.
O status deve indicar maturidade real da automação.
Automações compostas podem ser representadas por referências entre automações.
Dados operacionais relevantes podem permanecer neste documento mesmo quando não estiverem no repositório, desde que fiquem caracterizados como observação operacional.
