# Lousa — 3.5 Apply automático de migrations no Supabase vs2

## 1) Plano base

### 1.1 Objetivo do caso

Implantar o fluxo para que migrations versionadas no repositório, entregues pelo executor e adicionadas ao repo pelo humano, disparem automaticamente a criação e os ajustes necessários no Supabase, sem depender de copiar e colar SQL no painel.

### 1.2 Resultado esperado

**2.1** o executor investiga o estado atual
**2.2** o executor elabora o plano de implementação
**2.3** o executor entrega a migration SQL final do caso
**2.4** após a migration entrar no repositório, o workflow aplica automaticamente a migration no Supabase
**2.5** o fluxo gera evidência clara de sucesso ou falha

### 1.3 Plataformas envolvidas

**3.1** repositório
**3.2** GitHub Actions
**3.3** Supabase

### 1.4 Arquivos e áreas possivelmente envolvidos

**4.1** `.github/workflows/`
**4.2** diretório canônico de migrations no repositório
**4.3** configs e convenções operacionais ligadas ao Supabase

### 1.5 O que o executor deve investigar

**5.1** se já existe algum fluxo de apply de migrations
**5.2** qual é ou deve ser o diretório canônico de migrations
**5.3** qual evento do repositório deve disparar o apply automático
**5.4** quais credenciais/configurações de escrita são necessárias no workflow
**5.5** qual evidência o workflow deve produzir

### 1.6 O que o executor deve planejar

**6.1** o gatilho automático do workflow
**6.2** a forma de detectar migrations novas
**6.3** a estratégia de apply no projeto Supabase correto
**6.4** o comportamento em sucesso e falha
**6.5** a evidência mínima no Summary/logs

### 1.7 Escopo da implementação

**7.1** criar o workflow automático de apply
**7.2** preparar a lógica para aplicar migrations versionadas do repositório
**7.3** garantir que a automação atue sobre criação e ajuste de tabelas
**7.4** não incluir atualização documental final no escopo do executor

### 1.8 Critério de sucesso

**8.1** o executor confirma o gap ou a ausência do fluxo atual
**8.2** o executor implementa o workflow automático
**8.3** o executor entrega a migration final do caso
**8.4** o processo fica apto a aplicar automaticamente a migration após entrada no repositório
**8.5** o executor entrega relatório final com evidência operacional

### 1.9 Observação operacional

A documentação final do caso será atualizada depois pelo gestor, com base no relatório final do executor.

## 2) Investigação — Etapa 1

### 2.1 Status da investigação

Em execução.

### 2.2 Evidências confirmadas no repositório e docs

#### 2.2.1 Repositório alvo confirmado

* Repositório acessível: `AlcinoAfonso/LP-Factory-10`.
* Branch padrão: `main`.

#### 2.2.2 Workflows existentes identificados

* `.github/workflows/security.yml`
* `.github/workflows/upgrade-next-16-1-1.yml`
* `.github/workflows/pipeline-supabase-inspect.yml`
* `.github/workflows/pipeline-docs-apply-report.yml`
* `.github/workflows/automation-validador-final.yml`

#### 2.2.3 Estado atual do fluxo Supabase em automações

* Há workflow de inspeção read-only do Supabase.
* O workflow `pipeline-supabase-inspect.yml` é manual (`workflow_dispatch`) e usa apenas `SUPABASE_DB_URL_READONLY`.
* A documentação operacional atual registra explicitamente que o pipeline Supabase atual executa apenas SQL read-only.
* Até aqui, não foi encontrada evidência de workflow de apply automático de migrations.

#### 2.2.4 Diretório canônico de migrations

* Há diretório canônico versionado em `supabase/migrations/`.
* Evidência adicional de versionamento sequencial: arquivos como `0001__baseline_e7.sql`, `0004__account_profiles.sql` e `0005__ai_readonly.sql`.

#### 2.2.5 Estrutura/config atual do Supabase no repositório

* Não foi encontrada evidência de `supabase/config.toml` no repositório até esta etapa.
* A migration `0005__ai_readonly.sql` reforça o padrão de migrations idempotentes e separação entre SQL versionado e segredo aplicado por ambiente.

#### 2.2.6 Segredos e credenciais atualmente evidenciados em docs

* `OPENAI_API_KEY`
* `SUPABASE_DB_URL_READONLY`
* Até aqui, não há evidência documentada no repositório de credenciais de escrita para apply automático de migrations.

#### 2.2.7 Projeto Supabase atualmente indicado pela documentação técnica

* A Base Técnica aponta o projeto principal do app em Supabase.
* A URL pública documentada indica o ref `dpikmjgiteuafsbaubue` como evidência atual do projeto principal.
* A mesma Base Técnica registra que não existe ambiente STAGING ativo neste momento.

#### 2.2.8 Padrão atual de evidência operacional em workflows

* O repositório já usa `GITHUB_STEP_SUMMARY` em workflows/automations como evidência operacional mínima.
* Isso é compatível com o caso 3.5 para registrar sucesso, falha e resumo do apply.

### 2.3 Leitura preliminar do plano base do gestor

* **5.1** correto: existe fluxo Supabase, mas apenas de inspeção read-only.
* **5.2** correto: o diretório canônico de migrations é `supabase/migrations/`.
* **5.3** ainda em aberto: o evento ideal de disparo automático ainda será definido na etapa de plano.
* **5.4** correto, mas ainda sem evidência completa: serão necessárias credenciais/configurações de escrita que hoje não estão evidenciadas no repo/docs.
* **5.5** correto: o padrão atual do repo favorece evidência em logs + `Job Summary`.

### 2.4 Lacunas de evidência ainda não resolvidas

* Confirmar se existe alguma credencial de escrita fora do GitHub Actions já preparada para CI.
* Confirmar a estratégia exata de escrita futura no Supabase para apply automático.

### 2.5 Evidências adicionais trazidas por prints do humano

#### 2.5.1 GitHub Actions secrets

* `MAILBOX_EMAIL`
* `MAILBOX_PASSWORD`
* `OPENAI_API_KEY`
* `SUPABASE_DB_URL_READONLY`
* Não apareceu, nos prints, nenhum secret de escrita para apply automático de migrations.
* Não apareceu, nos prints, `SUPABASE_ACCESS_TOKEN`.
* Não apareceu, nos prints, `SUPABASE_DB_PASSWORD`.

#### 2.5.2 Workflows visíveis no GitHub Actions

* `Automation Validador Final`
* `Pipeline Docs — Apply Report`
* `Pipeline Supabase — Inspect`
* `Security Checks`
* `Upgrade Next.js to 16.1.1 (...)`
* Não apareceu workflow de apply automático de migrations no Supabase.

#### 2.5.3 Gatilho e branch do workflow Supabase atual

* O workflow `Pipeline Supabase — Inspect` está configurado com `workflow_dispatch`.
* O uso visível está a partir da branch `main`.

#### 2.5.4 Branch principal do repositório

* A default branch visível no GitHub é `main`.

#### 2.5.5 Rulesets do repositório

* A tela `Settings > Rules > Rulesets` mostra: `You haven't created any rulesets`.
* Portanto, não há rulesets configurados no repositório neste momento.

#### 2.5.6 Projeto Supabase alvo evidenciado pelos prints

* Projeto visível: `LP-Factory-10`.
* Ref visível: `dpikmjgiteuafsbaubue`.
* Ambiente visível: `Production`.

### 2.6 Leitura consolidada da Etapa 1

* O repositório tem diretório canônico de migrations, mas não tem evidência de automação de apply.
* O GitHub Actions atual não mostra secret de escrita para apply automático.
* O projeto Supabase alvo atualmente visível é o principal de produção.
* O workflow Supabase existente é manual e read-only.
* Não há rulesets no repositório.

### 2.7 Material ainda faltante do humano

* Confirmar se existe alguma credencial de escrita fora do GitHub Actions já preparada para CI.
* Confirmar a estratégia futura desejada para escrita/apply automático no Supabase.
* Confirmar a política operacional desejada para o futuro gatilho automático, caso queira algo diferente de `main`.

### 2.8 Status da Etapa 1

Investigação suficientemente fechada para seguir para a Etapa 2 — plano de implementação, com pendências externas explicitamente registradas.

## 3) Plano de implementação — Etapa 2

### 3.1 Objetivo operacional da implementação

Criar um workflow automático no GitHub Actions para aplicar migrations versionadas do diretório canônico `supabase/migrations/` no projeto Supabase atualmente alvo, com evidência mínima em logs e `Job Summary`, sem depender de copiar e colar SQL no painel.

### 3.2 O que será implementado

#### 3.2.1 Workflow novo de apply automático

* Criar um workflow dedicado em `.github/workflows/` para apply de migrations.
* O workflow deve disparar automaticamente em `push` para `main` quando houver alteração em `supabase/migrations/**`.
* O workflow deve também aceitar `workflow_dispatch` para replay/manual controlado.

#### 3.2.2 Estratégia de apply

* Usar Supabase CLI no próprio workflow.
* Fazer link explícito com o projeto alvo atual.
* Executar apply das migrations pendentes a partir do diretório canônico do repositório.
* A estratégia-base proposta é usar o mecanismo oficial de apply do CLI, sem inventar executor SQL custom.

#### 3.2.3 Evidência operacional mínima

* Registrar no `Job Summary`:

  * branch
  * commit
  * projeto alvo
  * diretório de migrations
  * arquivos de migration alterados no push
  * status final: sucesso ou falha
* Manter logs do CLI no job.

### 3.3 Arquivos a criar ou ajustar

#### 3.3.1 Criar

* `.github/workflows/pipeline-supabase-apply-migrations.yml`

#### 3.3.2 Ajustar

* Nenhum arquivo do runtime do Core é necessário nesta etapa.
* Nenhum arquivo de documentação final entra no escopo do executor nesta etapa.
* Nenhuma migration SQL específica será criada nesta subetapa de workflow; a migration final do caso continua como entrega separada do executor quando o caso exigir mudança de schema.

### 3.4 Plataformas realmente envolvidas

* repositório GitHub
* GitHub Actions
* Supabase

### 3.5 Configuração externa necessária

#### 3.5.1 GitHub Actions secrets esperados

* `SUPABASE_ACCESS_TOKEN`
* `SUPABASE_DB_PASSWORD`

#### 3.5.2 Dados operacionais do alvo

* projeto Supabase atualmente evidenciado: `LP-Factory-10`
* ref atualmente evidenciado: `dpikmjgiteuafsbaubue`
* branch padrão evidenciada: `main`

### 3.6 Estratégia de gatilho proposta

#### 3.6.1 Gatilho automático principal

* `push` em `main`
* filtro de paths em `supabase/migrations/**`

#### 3.6.2 Gatilho manual de apoio

* `workflow_dispatch`

#### 3.6.3 Motivo da escolha

* evita apply em branches de trabalho
* reduz risco de apply prematuro antes da entrada efetiva da migration no fluxo principal
* combina com o critério do caso: aplicar automaticamente após entrada no repositório principal

### 3.7 Estratégia para detectar migrations novas

* O gatilho por `paths` filtra alterações em `supabase/migrations/**`.
* O workflow deve listar, para evidência, os arquivos alterados entre o commit anterior e o commit atual.
* O apply real não depende de parser custom de nomes; o CLI deve aplicar apenas o que estiver pendente no projeto alvo.

### 3.8 Comportamento em sucesso e falha

#### 3.8.1 Sucesso

* workflow concluído com status verde
* `Job Summary` registrando alvo, migrations alteradas e status de sucesso

#### 3.8.2 Falha

* workflow concluído com erro
* `Job Summary` registrando alvo, migrations alteradas e etapa que falhou
* logs do job preservados como evidência operacional

### 3.9 Observability mínima

* `GITHUB_STEP_SUMMARY`
* logs do Supabase CLI no GitHub Actions
* identificação clara do projeto alvo, branch e commit

### 3.10 Riscos e dependências

#### 3.10.1 Dependência externa obrigatória

* criar/configurar no GitHub Actions os secrets de escrita necessários para o Supabase CLI

#### 3.10.2 Risco de drift entre histórico remoto e repositório

* o print do painel Supabase mostra `Last migration: No migrations`
* isso sugere que o histórico remoto de migrations pode não estar reconciliado com o diretório versionado do repositório
* antes de ativar o apply automático em produção, deve haver validação operacional desse estado

#### 3.10.3 Risco de idempotência real das migrations legadas

* a Base Técnica exige migrations idempotentes, mas a investigação desta etapa não validou uma a uma as migrations já existentes
* se o histórico remoto estiver vazio e o CLI tentar reaplicar tudo, migrations antigas podem falhar se não forem realmente idempotentes

### 3.11 Testes previstos para a Etapa 4

#### 3.11.1 Executor

* validar sintaxe do workflow
* revisar coerência do trigger, secrets esperados e summary

#### 3.11.2 Humano

* confirmar criação dos secrets externos
* executar o workflow manualmente (`workflow_dispatch`) como smoke inicial controlado

#### 3.11.3 Plataforma externa

* Supabase CLI precisa autenticar e conseguir aplicar migrations no projeto alvo
* o projeto remoto precisa aceitar o apply sem conflito de histórico

### 3.12 Status da Etapa 2

Plano de implementação definido, com dependências externas explicitadas e sem expansão de escopo.

## 4) Regra operacional vigente para a Etapa 3

### 4.1 Substituição do conteúdo de referência do item 6.4

#### 6.4 Etapa 3 — Implementação

* executar apenas o que estiver no plano
* não expandir escopo
* se surgir conflito relevante durante a implementação, parar e reportar
* se houver criação ou ajuste de arquivos no repositório, preparar briefing para o Codex com base em `docs/template-briefing-codex.md`
* se houver configuração externa, entregar passo a passo objetivo e pedir ajuda ao humano ou ao Modo agente quando necessário
* separar claramente o que é ajuste no repositório e o que depende de configuração externa

## 5) Etapa 3 — Execução

### 5.1 Resultado da execução

* O ajuste no repositório foi preparado como briefing para o Codex, conforme a regra operacional vigente.
* A configuração externa necessária foi separada em passo a passo para o humano.
* A implementação não foi declarada como concluída porque existe conflito relevante externo antes do smoke seguro.

### 5.2 Conflitos relevantes identificados

* Ainda não existem, nos prints do GitHub Actions, os secrets de escrita esperados para o Supabase CLI.
* O painel do Supabase mostra `Last migration: No migrations`, o que indica risco de drift entre o histórico remoto e o diretório versionado do repositório.
* Por esse motivo, a etapa foi executada até o limite seguro: briefing de repositório + instruções de configuração externa.

### 5.3 Ajuste no repositório

* Arquivo a criar: `.github/workflows/pipeline-supabase-apply-migrations.yml`
* Entrega preparada: briefing para o Codex com conteúdo completo do arquivo novo.

### 5.4 Configuração externa separada

* `SUPABASE_ACCESS_TOKEN` criado no GitHub Actions.
* `SUPABASE_DB_PASSWORD` criado no GitHub Actions.
* A dependência externa mínima de secrets de escrita ficou atendida.

### 5.5 Entrega do Codex avaliada

* Branch avaliada: `codex/create-supabase-migration-workflow`.
* Arquivo criado na branch: `.github/workflows/pipeline-supabase-apply-migrations.yml`.
* Comparação com `main`: 1 arquivo novo, sem expansão adicional de escopo.
* O conteúdo do workflow ficou alinhado ao briefing preparado para o Codex.
* O relatório do Codex foi aceito com ressalvas.

#### 5.5.1 Pontos aprovados

* arquivo correto criado
* escopo contido em um único arquivo
* gatilhos corretos: `push` em `main` com filtro em `supabase/migrations/**` e `workflow_dispatch`
* estratégia correta: `supabase link` + `supabase db push --linked`
* evidência mínima em `GITHUB_STEP_SUMMARY`

#### 5.5.2 Ressalvas registradas

* a pendência de secrets mencionada no relatório do Codex ficou desatualizada, porque os dois secrets já foram criados depois
* o status operacional do caso ainda não deve ser tratado como plenamente pronto sem o primeiro smoke manual
* permanece o risco de drift/histórico remoto por causa da evidência no painel Supabase: `Last migration: No migrations`

### 5.6 Status consolidado da Etapa 3

* Ajuste no repositório: preparado e validado em branch do Codex
* Configuração externa mínima: concluída
* Resultado da etapa: implementação aprovada com ressalvas operacionais
* Próxima etapa necessária: executar o primeiro smoke manual controlado do workflow

## 6) Etapa 4 — Testes

### 6.1 Estado atual

Aguardando smoke manual inicial do workflow de apply de migrations.

### 6.2 Objetivo do primeiro smoke

Validar se o workflow autentica no Supabase, faz o link no projeto correto e registra evidência adequada no Summary/logs, sem assumir funcionamento pleno antes da primeira execução real.

### 6.3 Risco central ainda ativo

* possível drift entre o histórico remoto e o diretório versionado de migrations
* evidência atual do painel Supabase: `Last migration: No migrations`
* por isso, a primeira execução deve ser manual e observada
