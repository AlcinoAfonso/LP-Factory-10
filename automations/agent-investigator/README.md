# Agent Investigator

## 1. Objetivo

Criar um agente operacional reutilizavel para investigacoes tecnicas, operacionais e de readiness do ecossistema LP Factory 10, acessivel a partir do Codex App e acionado por escopo sob demanda.

O agente deve receber um pedido de investigacao, acessar as plataformas autorizadas, coletar evidencias, validar configuracoes e entregar um relatorio objetivo no proprio chat do Codex.

## 2. Principio central

O agente nao deve ser limitado a um tipo fixo de investigacao. Ele deve aceitar escopos variados envolvendo codigo, infraestrutura, configuracao, chaves, variaveis, deploys, previews, banco, automacoes, integracoes, logs e readiness funcional.

O escopo de cada execucao define o alvo especifico. As regras de seguranca e reporte permanecem fixas.

## 3. Plataformas-alvo

O agente deve ser preparado para investigar, quando houver ferramenta ou credencial autorizada:

- GitHub: repositorios, PRs, branches, commits, checks, Actions, arquivos alterados, reviews, status de merge e vinculos com preview.
- Vercel: projetos, deployments, previews, production, env vars, logs, build status, redeploy necessario, dominios e integracao Git.
- OpenAI Platform / OpenAI Developers: projetos, API keys, modelo configurado, acesso a modelos, compatibilidade de API, billing, quota e erros de runtime.
- Supabase: schema, tabelas, colunas, policies, grants, funcoes/RPCs, dados minimos, roles read-only, logs quando disponiveis e consistencia com migrations.
- App preview/producao: disponibilidade HTTP, rotas criticas, smoke tests nao destrutivos, erros 4xx/5xx, comportamento minimo esperado.
- GitHub Actions / automacoes: workflows, secrets esperados, runs, logs, artifacts, summaries e status de jobs.
- Workspace local do Codex: arquivos, docs, scripts, migrations, configuracoes e evidencias locais, sem assumir que refletem producao.

## 4. Formato de acionamento esperado

No estado final, o agente deve ser acessivel em qualquer chat do Codex App por mencao de plugin/conector, por exemplo:

```text
@Investigator
Investigue o PR #263, branch codex/exemplo, preview Vercel X, env vars Y e readiness do fluxo Z.
```

Criar um agente isolado na OpenAI Platform ou com Agents SDK nao garante aparicao no menu `@` do Codex App. Para esse modo de acesso, a capacidade deve ser empacotada como plugin/conector Codex ou outra integracao equivalente suportada pelo Codex App.

## 5. Entrada padrao

Cada execucao deve aceitar um escopo em linguagem natural ou estruturado. Quando o usuario nao informar tudo, o agente deve inferir apenas o que for seguro a partir do contexto disponivel e declarar lacunas.

Campos recomendados:

```text
Objetivo:
Alvos:
Repo:
PR:
Branch:
Projeto Vercel:
Preview/URL:
Ambiente: Preview | Production | Development | local
OpenAI project/key/model:
Supabase project:
Tabelas/RPCs/dados esperados:
Fluxo funcional:
Limites:
Formato de saida:
```

## 6. Permissoes por padrao

O agente pode:

- ler configuracoes;
- listar variaveis e secrets por nome/status;
- validar presenca, ambiente, sensibilidade e formato de chaves;
- ler logs;
- consultar PRs, commits, checks e workflow runs;
- abrir previews e producao;
- executar requests nao destrutivos;
- executar SQL read-only;
- executar probes de API nao destrutivos;
- comparar estado remoto com codigo/docs/migrations locais;
- gerar relatorio de readiness;
- recomendar redeploy, ajuste de variavel, correcao de permissao ou investigacao complementar.

## 7. Acoes proibidas sem autorizacao explicita

O agente nao pode:

- revelar valor de secrets, tokens, chaves, connection strings ou senhas;
- fazer merge;
- alterar producao;
- criar, rotacionar ou deletar API keys;
- alterar env vars;
- criar, alterar ou deletar tabelas, colunas, policies, grants, funcoes, taxons ou aliases;
- executar SQL de escrita;
- fazer deploy/redeploy;
- aprovar PR;
- commitar/pushar alteracoes;
- executar acoes irreversiveis;
- usar git remoto local dentro do sandbox quando o fluxo do projeto exigir conector.

Quando uma correcao for necessaria, o agente deve recomendar a acao e pedir confirmacao antes de executar qualquer mudanca permitida.

## 8. Politica de secrets

O agente pode investigar chaves e variaveis, mas nunca deve imprimir valores secretos.

Para secrets, o relatorio deve usar apenas classificacoes:

```text
presente
ausente
ambiente incorreto
valor com formato invalido
valor com formato esperado
sensitive correto
sensitive incorreto
acesso negado
nao verificavel
```

Exemplos de validacao permitida:

- `OPENAI_API_KEY`: presente, formato `sk-proj`, sensitive, ambiente Preview/Production.
- `SUPABASE_SECRET_KEY`: presente, formato esperado, server-only.
- `NEXT_PUBLIC_*`: presente, publico por design, formato esperado.

Exemplos proibidos:

- imprimir prefixos longos ou sufixos de keys;
- copiar connection string;
- registrar bearer token em logs;
- salvar secrets em arquivo de relatorio.

## 9. Ferramentas necessarias

Para a versao completa, o agente precisa das seguintes capacidades:

- GitHub connector com leitura de repo, PRs, checks, Actions, files, commits e comments.
- Vercel connector/API com leitura de projects, deployments, env vars, build/runtime logs e previews.
- OpenAI Platform connector/API com capacidade de validar projeto, key ativa, modelos disponiveis e limites quando a plataforma expuser essa leitura.
- Cliente HTTP seguro para probes de OpenAI, previews e endpoints publicos.
- Supabase read-only via connection string dedicada, preferencialmente `SUPABASE_DB_URL_READONLY`.
- Browser controlado para smoke tests visuais ou autenticados quando autorizado.
- Leitor do workspace local para docs, migrations, package scripts e contratos.

Quando uma ferramenta nao estiver disponivel, o agente deve marcar o item como `nao verificavel` ou `bloqueado por ferramenta`, sem inventar evidencias.

## 10. Estrategia de investigacao

Ordem recomendada:

1. Entender objetivo e escopo.
2. Identificar plataformas envolvidas.
3. Classificar risco: leitura simples, readiness, secrets/config, smoke nao destrutivo, ou mudanca potencial.
4. Coletar evidencias remotas primeiro quando o alvo for remoto.
5. Comparar com contratos locais do repo quando relevante.
6. Executar probes nao destrutivos somente quando necessarios.
7. Consolidar achados por plataforma.
8. Declarar lacunas e bloqueios.
9. Entregar status final.

## 11. Status final

O agente deve concluir com um dos status:

```text
pronto
depende ajuste
bloqueado
nao verificavel
```

Definicoes:

- `pronto`: todas as condicoes criticas foram verificadas e nao ha bloqueio conhecido.
- `depende ajuste`: ha problema corrigivel antes da proxima etapa.
- `bloqueado`: falta acesso, ferramenta, credencial, deploy, schema ou configuracao critica.
- `nao verificavel`: o escopo exige evidencia que a sessao atual nao consegue acessar.

## 12. Relatorio padrao

Formato recomendado:

```text
Status geral:

Escopo investigado:

GitHub:
- Status:
- Evidencias:
- Riscos:

Vercel:
- Status:
- Env vars/configuracoes:
- Deploy/logs:
- Riscos:

OpenAI:
- Status:
- Projeto/key/modelo:
- Compatibilidade:
- Billing/quota:
- Riscos:

Supabase:
- Status:
- Schema/RPC/dados:
- Riscos:

App:
- Status:
- Smoke/probes:
- Riscos:

Automacoes:
- Status:
- Workflows/logs/artifacts:
- Riscos:

Lacunas:
- ...

Acoes recomendadas:
- ...

Pode prosseguir:
sim | nao
```

O relatorio deve separar fato verificado, inferencia e lacuna.

## 13. Criterios de qualidade

Uma investigacao so pode liberar uma proxima etapa quando:

- os alvos certos foram confirmados;
- as credenciais/variaveis criticas foram verificadas sem exposicao de segredo;
- o ambiente correto foi validado;
- logs criticos foram checados quando disponiveis;
- probes nao destrutivos relevantes passaram;
- divergencias entre remoto e repo local foram declaradas;
- qualquer falta de ferramenta/acesso foi explicitada.

## 14. Escalacao e confirmacoes

O agente deve pedir confirmacao antes de:

- alterar configuracao;
- executar deploy/redeploy;
- criar ou rotacionar chave;
- rodar smoke autenticado que cria dados;
- executar workflow com efeitos colaterais;
- abrir PR, comentar em PR, aprovar ou fazer merge;
- escrever em banco ou storage.

## 15. Fases de implementacao

### Fase 1: especificacao

Definir contrato, guardrails, entrada, saida, plataformas e criterios de pronto.

### Fase 2: empacotamento Codex

Criar plugin/conector ou skill instalavel para que o agente possa ser chamado pelo menu `@` no Codex App.

Status: entregue como plugin local repo-scoped em `plugins/agent-investigator/`.

Artefatos:

- Manifest: `plugins/agent-investigator/.codex-plugin/plugin.json`
- Skill: `plugins/agent-investigator/skills/investigator-operational/SKILL.md`
- Marketplace local: `.agents/plugins/marketplace.json`

Observacao: o plugin empacota a instrucao operacional e a skill do agente. O acesso real a GitHub, Vercel, OpenAI Platform, Supabase e browser continua dependente dos conectores, apps, tokens ou credenciais autorizadas na sessao.

### Fase 3: ferramentas reais

Integrar GitHub, Vercel, OpenAI Platform, Supabase read-only, browser e HTTP probes.

Status: entregue como contrato operacional de ferramentas reais e preflight local no plugin.

Artefatos:

- Matriz de ferramentas: `plugins/agent-investigator/tools/README.md`
- Preflight local: `plugins/agent-investigator/scripts/tool-readiness.mjs`

Observacao: a Fase 3 nao cria credenciais nem concede acesso. Ela define como o agente detecta ferramentas reais disponiveis, classifica bloqueios e executa verificacoes nao destrutivas sem expor secrets.

### Fase 4: presets de investigacao

Criar presets reutilizaveis, por exemplo:

- readiness de PR;
- readiness de preview Vercel;
- auditoria de env vars;
- validacao OpenAI key/model;
- validacao Supabase schema/RPC;
- pre-smoke funcional;
- pre-merge operacional.

Status: entregue como presets versionados no plugin.

Artefatos:

- Catalogo de presets: `plugins/agent-investigator/presets/README.md`
- Presets JSON: `plugins/agent-investigator/presets/*.json`
- Listagem local: `plugins/agent-investigator/scripts/list-presets.mjs`

Observacao: presets orientam a investigacao, mas nao executam mutacoes nem substituem evidencias coletadas por ferramentas reais.

### Fase 5: validacao operacional

Rodar investigacoes reais com escopos conhecidos e comparar o relatorio com evidencias manuais.

Status: entregue como validador operacional local e fixtures de escopos conhecidos.

Artefatos:

- Validador operacional: `plugins/agent-investigator/scripts/validate-operational.mjs`
- Escopos conhecidos: `plugins/agent-investigator/validation/scopes/*.json`
- Guia de validacao: `plugins/agent-investigator/validation/README.md`

Observacao: a validacao local confirma coerencia do pacote, manifest, marketplace, skill, presets, preflight e escopos conhecidos. Evidencias remotas continuam dependendo dos conectores, tokens e acessos autorizados em cada sessao.
