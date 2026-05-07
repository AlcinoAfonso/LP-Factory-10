# Lousa — 3.5 Apply automático de migrations no Supabase vs3

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

* Os secrets de escrita esperados para o Supabase CLI foram criados depois, por evidência externa trazida em prints do humano.
* O painel do Supabase mostra `Last migration: No migrations`, o que indica risco de drift entre o histórico remoto e o diretório versionado do repositório.
* O primeiro smoke manual continua necessário antes de tratar o fluxo como operacionalmente validado.

### 5.3 Ajuste no repositório

* Arquivo a criar: `.github/workflows/pipeline-supabase-apply-migrations.yml`
* Entrega preparada: briefing para o Codex com conteúdo completo do arquivo novo.

### 5.4 Configuração externa separada

* `SUPABASE_ACCESS_TOKEN` criado no GitHub Actions, por evidência externa trazida em prints do humano.
* `SUPABASE_DB_PASSWORD` criado no GitHub Actions, por evidência externa trazida em prints do humano.
* A dependência externa mínima de secrets de escrita ficou atendida por evidência externa, não por evidência do repositório.

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
* o workflow usa `supabase/setup-cli@v1` com `version: latest`, o que funciona, mas deixa a execução mais sujeita a variação futura do CLI

### 5.6 Status consolidado da Etapa 3

* Ajuste no repositório: validado em branch do Codex
* Configuração externa mínima: concluída por evidência externa
* Smoke manual inicial: pendente
* Risco de drift remoto: ainda aberto
* Próxima etapa necessária: executar o primeiro smoke manual controlado do workflow

## 6) Etapa 4 — Testes

### 6.1 Estado atual

Etapa 4 iniciada.

### 6.2 Objetivo do primeiro smoke

Validar se o workflow autentica no Supabase, faz o link no projeto correto e registra evidência adequada no Summary/logs, sem assumir funcionamento pleno antes da primeira execução real.

### 6.3 Risco central ainda ativo

* possível drift entre o histórico remoto e o diretório versionado de migrations
* evidência atual do painel Supabase: `Last migration: No migrations`
* por isso, a primeira execução deve ser manual e observada

### 6.4 Testes executados pelo executor

#### 6.4.1 Revisão estrutural do workflow na branch do Codex

* arquivo avaliado: `.github/workflows/pipeline-supabase-apply-migrations.yml`
* gatilhos confirmados: `push` em `main` com filtro em `supabase/migrations/**` e `workflow_dispatch`
* referência de projeto confirmada no workflow: `dpikmjgiteuafsbaubue`
* secrets esperados confirmados no workflow: `SUPABASE_ACCESS_TOKEN` e `SUPABASE_DB_PASSWORD`
* evidência mínima confirmada no workflow: uso de `GITHUB_STEP_SUMMARY`
* falhas de pré-condição previstas no próprio job: secret ausente, diretório ausente, falha em `supabase link`, falha em `supabase db push`

#### 6.4.2 Limite do executor nesta etapa

* o executor não executou o workflow real no GitHub Actions
* o executor não executou `supabase db push` em ambiente real
* portanto, funcionamento real ainda não pode ser declarado como validado

### 6.5 Teste que depende do humano

#### 6.5.1 Smoke manual inicial recomendado

1. abrir a branch do Codex ou o PR correspondente
2. garantir que o workflow esteja disponível na branch em que será testado
3. ir em `Actions`
4. abrir `Pipeline Supabase — Apply Migrations`
5. clicar em `Run workflow`
6. escolher a branch que contém o workflow
7. executar manualmente
8. ao final, abrir o run e capturar:

   * status final do job
   * etapa em que falhou ou concluiu
   * conteúdo do `Summary`
   * trecho do log onde apareça `supabase link` e `supabase db push`

#### 6.5.2 Evidências que o humano deve trazer

* print da tela final do run
* print do `Summary`
* print ou trecho do log da etapa `Apply migrations`

### 6.6 Teste que depende de plataforma externa

* autenticação do Supabase CLI com `SUPABASE_ACCESS_TOKEN`
* aceitação do `SUPABASE_DB_PASSWORD` pelo projeto alvo
* sucesso do `supabase link`
* sucesso ou falha controlada do `supabase db push --linked`
* comportamento do histórico remoto de migrations diante do estado atual do projeto

### 6.7 Critério de leitura do primeiro smoke

#### 6.7.1 Se o run falhar antes do link

* tratar como problema de secret/configuração externa

#### 6.7.2 Se o run falhar no `supabase db push`

* tratar como evidência forte de conflito entre histórico remoto e migrations versionadas, ou outra incompatibilidade real de apply

#### 6.7.3 Se o run concluir com sucesso

* considerar o workflow validado no smoke inicial
* ainda assim registrar o resultado como validação inicial, não como prova de ausência total de risco futuro

### 6.8 Status da Etapa 4

* testes do executor: concluídos no limite do ambiente disponível
* smoke manual inicial: pendente de execução pelo humano
* validação operacional final da etapa: pendente do primeiro run real

## 7) Plano ajustado do caso 3.5 — fase baseline

### 7.1 Motivo do ajuste de plano

* o histórico remoto de migrations no projeto atual está ausente
* a comparação entre `docs/schema.md` e o diretório `supabase/migrations/` confirmou que as migrations atuais representam apenas uma fração do histórico real do banco
* por isso, o fluxo de apply automático não deve ser inaugurado com base no conjunto legado atual

### 7.2 Diretriz central

* tratar o banco remoto atual como fonte de verdade
* gerar um baseline novo e oficial
* alinhar o histórico remoto a esse baseline
* só depois usar migrations incrementais novas com o workflow automático

### 7.3 O que muda no caso 3.5

* o objetivo do workflow automático permanece
* o plano operacional passa a ter uma fase prévia obrigatória de baseline
* o smoke do workflow de apply deixa de ser o próximo passo imediato e passa a ser posterior ao baseline

### 7.4 Etapas do plano ajustado

#### 7.4.1 Etapa A — congelar o legado atual

* declarar explicitamente que o conjunto atual de migrations não é baseline confiável do banco
* impedir que esse conjunto seja tratado como base oficial do primeiro `db push`
* preservar os arquivos atuais até decisão controlada sobre destino técnico

#### 7.4.2 Etapa B — gerar baseline oficial do estado remoto

* usar o estado atual do banco como fonte de verdade
* gerar uma migration baseline nova em formato compatível com o fluxo oficial do Supabase CLI
* gravar o baseline no diretório canônico `supabase/migrations/`

#### 7.4.3 Etapa C — sanear histórico remoto

* conferir o estado local/remoto com a CLI
* reparar o histórico remoto se necessário
* deixar local e remoto alinhados ao baseline novo

#### 7.4.4 Etapa D — decidir o destino do legado

* arquivar ou retirar do fluxo operacional o conjunto legado atual
* evitar coexistência ambígua entre histórico legado incompleto e histórico oficial novo
* não fazer limpeza patch por patch no escuro

#### 7.4.5 Etapa E — retomar o fluxo incremental

* executor volta a gerar migrations incrementais novas
* humano adiciona a migration ao repositório
* workflow automático aplica somente o que estiver pendente
* histórico remoto passa a refletir o novo ciclo oficial

### 7.5 O que deve ser evitado

* não usar uma migration de teste como substituto do baseline
* não assumir que o primeiro `db push` vai considerar só a última migration
* não apagar migrations de teste do repositório após execução
* não ativar o fluxo automático como confiável antes do baseline saneado

### 7.6 Tratamento do workflow já preparado

* o workflow da branch do Codex continua válido como peça de infraestrutura
* ele não deve ser tratado como fluxo operacional confiável antes do baseline
* o primeiro smoke real do workflow deve ocorrer só depois do baseline e do saneamento do histórico

### 7.7 Próximo trabalho do executor

* preparar a fase baseline do caso 3.5
* mapear o impacto do legado atual em `supabase/migrations/`
* preparar a estratégia de geração do baseline e de saneamento do histórico remoto
* separar claramente o que será ajuste no repositório e o que dependerá de ação externa

### 7.8 Status consolidado após ajuste de plano

* workflow de apply: preparado
* secrets de escrita: configurados
* histórico remoto de migrations: ausente
* baseline oficial: pendente
* fluxo automático confiável: ainda não liberado

## 8) Plano operacional da fase baseline

### 8.1 Etapa 1 — Extração do baseline

Responsável: executor + humano, com ação externa no ambiente do banco.

Objetivo: obter o baseline real a partir do banco remoto atual.

Saída esperada: arquivo bruto de baseline extraído do estado real do banco.

Condição para avançar: baseline bruto extraído com sucesso.

### 8.2 Etapa 2 — Revisão técnica do baseline

Responsável: executor.

Objetivo: revisar o baseline extraído e transformá-lo na migration baseline oficial.

Saída esperada: arquivo completo da migration baseline + leitura curta do impacto no legado atual.

Condição para avançar: baseline oficial tecnicamente aceito.

### 8.3 Etapa 3 — Transição do legado

Responsável: executor.

Objetivo: definir exatamente como o legado atual sai do fluxo oficial.

Saída esperada: destino técnico fechado para o legado durante a transição e regra de remoção posterior.

Condição para avançar: legado classificado como transitório e sem papel no histórico oficial novo.

### 8.4 Etapa 4 — Alinhamento do histórico remoto

Responsável: executor + humano, com ação externa no Supabase CLI / ambiente.

Objetivo: alinhar o histórico remoto ao baseline novo.

Saída esperada: histórico remoto reconciliado com o baseline oficial.

Condição para avançar: local e remoto alinhados ao novo histórico oficial.

### 8.5 Etapa 5 — Liberação controlada do workflow

Responsável: humano.

Objetivo: liberar o primeiro uso real do workflow de apply depois da transição segura.

Saída esperada: smoke manual do workflow com evidência em logs e Summary.

Condição para fechar a fase: baseline oficial ativo, legado fora do fluxo e smoke manual concluído depois da transição.

### 8.6 Regra de sequência

* Não inverter a ordem das etapas.
* Não executar smoke antes do baseline oficial.
* Não remover o legado antes do alinhamento seguro do novo histórico.
* Se surgir conflito relevante em qualquer etapa, parar e reportar antes de avançar.

### 8.7 Execução segura no repositório

* O baseline real ainda não está disponível no repositório e não deve ser improvisado.
* O diretório `supabase/migrations/` permanece como legado técnico transitório enquanto a extração externa não voltar com o baseline bruto.
* O workflow `.github/workflows/pipeline-supabase-apply-migrations.yml` deve permanecer impedido de executar apply real até a conclusão da fase baseline.
* A liberação futura do workflow depende de configurar `SUPABASE_APPLY_MIGRATIONS_ENABLED=true` apenas depois de:
  * baseline oficial versionado;
  * histórico remoto alinhado;
  * legado fora do fluxo ativo;
  * smoke manual autorizado.

### 8.8 Leitura do legado atual

* `0001__baseline_e7.sql` está vazio e não representa baseline real.
* `0002__ensure_first_account_for_current_user.sql` a `0008__e10_5_2_1_research_audience_scope_parent.sql` cobrem incrementos específicos do produto, não o histórico completo do banco remoto.
* `accounts_name_gin_idx.sql` não segue o padrão timestamp/nome do Supabase CLI e deve ser tratado como apoio legado, não como peça do histórico oficial novo.
* Não há `supabase/config.toml` no estado atual do repositório.
* O destino técnico recomendado é retirar esses arquivos do fluxo ativo quando o baseline oficial entrar, preservando-os apenas como apoio de comparação até a transição segura. A remoção final só deve ocorrer depois do alinhamento remoto e do smoke manual pós-transição.

### 8.9 Ações externas necessárias

Estas ações devem ser executadas fora do Codex, por executor/humano com Supabase CLI autenticado, acesso ao projeto remoto e Docker disponível.

1. Trabalhar em uma pasta temporária limpa, sem copiar as migrations legadas atuais.
2. Rodar `supabase init`.
3. Rodar `supabase link --project-ref dpikmjgiteuafsbaubue`.
4. Rodar `supabase migration list --linked` e guardar a saída.
5. Rodar `supabase db pull baseline_oficial --linked --schema public`.
6. Quando o CLI perguntar se deve atualizar o histórico remoto nesta etapa, responder `n`, porque a revisão técnica do baseline ainda não foi concluída.
7. Entregar ao repositório o arquivo SQL gerado e a saída inicial de `migration list`.
8. Depois da revisão técnica aceitar o baseline oficial, rodar `supabase migration repair <timestamp_do_baseline> --status applied --linked`.
9. Rodar novamente `supabase migration list --linked` e guardar a saída final.

Não rodar `supabase db push` nesta fase.
