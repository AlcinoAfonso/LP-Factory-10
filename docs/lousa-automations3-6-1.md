# Lousa — 3.6.1 Baseline de migrations no Supabase

> Status final: concluído em 12/06/2026. As seções 1 a 12 preservam o registro histórico da preparação e validação; a seção 13 contém o encerramento definitivo e prevalece sobre estados intermediários.

## 1) Objetivo da fase baseline

* Extrair o baseline real do banco remoto atual.
* Transformar esse baseline no novo histórico oficial de migrations.
* Preparar a retirada segura do legado atual de `supabase/migrations/`.
* Liberar com segurança o fluxo futuro de migrations incrementais.

## 2) Bloqueio central

* O histórico remoto de migrations no projeto atual está ausente.
* O conjunto atual de `supabase/migrations/` cobre apenas uma fração do banco.
* Esse conjunto não pode ser tratado como baseline oficial.
* O workflow de apply não deve ser usado como fluxo confiável antes do baseline.

## 3) Decisão fechada

* O banco remoto atual é a fonte de verdade.
* O baseline deve nascer do estado real atual do banco.
* O legado atual é apenas apoio transitório durante a transição.
* O legado deve ser removido depois que o baseline novo assumir o papel de histórico oficial.
* O smoke do workflow de apply só pode acontecer depois da transição segura.

## 4) Plano operacional da baseline

### 4.1 Etapa 1 — Extração do baseline

* Responsável: executor + humano, com ação externa no ambiente do banco.
* Objetivo: obter o baseline real a partir do banco remoto atual.
* Saída esperada: arquivo bruto de baseline extraído do estado real do banco.
* Condição para avançar: baseline bruto extraído com sucesso.

### 4.2 Etapa 2 — Revisão técnica do baseline

* Responsável: executor.
* Objetivo: revisar o baseline extraído e transformá-lo na migration baseline oficial.
* Saída esperada: arquivo completo da migration baseline + leitura curta do impacto no legado atual.
* Condição para avançar: baseline oficial tecnicamente aceito.

### 4.3 Etapa 3 — Transição do legado

* Responsável: executor.
* Objetivo: definir exatamente como o legado atual sai do fluxo oficial.
* Saída esperada: destino técnico fechado para o legado durante a transição e regra de remoção posterior.
* Condição para avançar: legado classificado como transitório e sem papel no histórico oficial novo.

### 4.4 Etapa 4 — Alinhamento do histórico remoto

* Responsável: executor + humano, com ação externa no Supabase CLI / ambiente.
* Objetivo: alinhar o histórico remoto ao baseline novo.
* Saída esperada: histórico remoto reconciliado com o baseline oficial.
* Condição para avançar: local e remoto alinhados ao novo histórico oficial.

### 4.5 Etapa 5 — Liberação controlada do workflow

* Responsável: humano.
* Objetivo: liberar o primeiro uso real do workflow de apply depois da transição segura.
* Saída esperada: smoke manual do workflow com evidência em logs e Summary.
* Condição para fechar a fase: baseline oficial ativo, legado fora do fluxo e smoke manual concluído depois da transição.

## 5) Ações externas necessárias

* A extração do baseline real depende de execução externa no Supabase CLI / ambiente.
* O alinhamento do histórico remoto também depende de execução externa.
* Essas ações não devem ser improvisadas dentro do repositório.
* Se a execução externa ainda não tiver ocorrido, a fase baseline permanece aberta.

## 6) Tratamento do legado

* O conjunto atual de `supabase/migrations/` deve permanecer apenas como apoio transitório durante a fase baseline.
* Esse conjunto não deve ser tratado como histórico oficial novo.
* A remoção do legado só deve acontecer depois de:

  * baseline oficial versionado
  * histórico remoto alinhado
  * transição segura concluída
* Não fazer limpeza patch por patch no escuro.

## 7) Gate de saída da baseline

A baseline só pode ser tratada como concluída quando os itens abaixo estiverem fechados:

* baseline real extraído do banco remoto
* migration baseline oficial aceita
* histórico remoto alinhado ao baseline
* legado atual retirado do fluxo oficial
* workflow liberado apenas depois disso
* smoke manual executado após a transição

## 8) Status atual

* risco imediato de apply automático: mitigado pelo bloqueio no workflow atual
* baseline oficial: proposta local criada e aguardando aprovação para adoção remota
* extração real do baseline: concluída para o schema `public`
* histórico remoto alinhado: pendente
* legado removido do diretório ativo: concluído localmente
* workflow de apply: preparado, mas bloqueado por padrão e não liberado como fluxo confiável
* validação isolada: concluída
* bloqueio central atual: autorização para alinhamento do histórico remoto

## 9) Execução segura no repositório

* O baseline real não deve ser improvisado no repositório.
* `supabase/migrations/` contém somente a baseline proposta; o legado foi preservado em `supabase/legacy-migrations/`.
* O workflow de apply não deve ser tratado como fluxo liberado antes da baseline oficial.
* Como o apply automático está bloqueado no workflow atual, a baseline segue pendente sem exigir execução urgente de A3.6.1 neste momento.
* A liberação futura do workflow só pode acontecer depois de:

  * baseline oficial versionado
  * histórico remoto alinhado
  * legado fora do fluxo ativo
  * smoke manual autorizado

## 10) Leitura operacional do legado atual

* `0001__baseline_e7.sql` não deve ser tratado como baseline real do banco.
* Os arquivos legados atuais em `supabase/migrations/` representam apenas parte do histórico do banco remoto.
* Arquivos fora do padrão esperado do Supabase CLI devem ser tratados como apoio legado, não como histórico oficial novo.
* `supabase/config.toml` foi criado por `supabase init` sem `--force`.
* O legado saiu do fluxo ativo local e permanece preservado em `supabase/legacy-migrations/`.

## 11) Ações externas necessárias

* A extração do baseline e o alinhamento do histórico remoto dependem de execução externa.
* Se for necessário detalhar o passo a passo externo, isso deve ser pedido em execução separada.

## 12) Execução limitada de 11/06/2026

### 12.1 Base e ferramentas

* base Git: `origin/main` em `a8ef6894011b13758cc9383ea9c2ffd8653b71ef`
* branch: `codex/supabase-migrations-baseline`
* Supabase CLI: `2.106.0`, binário standalone oficial com checksum validado
* PostgreSQL client: `17.10`, arquivo oficial de binários EDB fora do repositório
* `supabase init`: executado sem `--force`; criou `supabase/config.toml` e `supabase/.gitignore`
* autenticação: fluxo interativo da CLI; nenhuma credencial foi registrada
* `supabase link`: conexão remota com escrita auxiliar somente em `supabase/.temp/`, diretório ignorado

### 12.2 Medição com o legado intacto

* `supabase migration list --linked`: exit code `0`
* migrations reconhecidas como locais e ausentes no remoto: `0001` a `0014`
* migration ignorada por nome inválido: `accounts_name_gin_idx.sql`
* `supabase db push --linked --dry-run`: exit code `0`
* resultado: as 14 migrations numeradas seriam aplicadas
* efeito local do dry-run: nenhum arquivo criado ou alterado

### 12.3 Inventário remoto

* a relação `supabase_migrations.schema_migrations` não existe (`42P01`)
* inventário de `public`: 16 tabelas, 5 views, 39 functions, 13 triggers, 56 policies, 75 constraints e 57 índices
* inventários estruturais sanitizados: `supabase/baseline/inventory/`
* inventários de roles, grants e default privileges: preservados somente como evidência local temporária
* dump schema-only remoto: não versionado; SHA-256 `1848538E440E9FA4F1511FCFA6AFF8A5BEA1C654EC9047EC33830C36B13AD451`
* dados de negócio, secrets e connection strings não foram extraídos

### 12.4 Escopo da baseline proposta

* migration: `supabase/migrations/20260611172930_remote_public_baseline.sql`
* inclui objetos próprios do schema `public`
* inclui `pg_trgm` no schema `extensions` e `USAGE` para `service_role`
* exclui `auth`, `storage`, `realtime`, `graphql`, `vault` e demais schemas gerenciados
* exclui dados, buckets, objetos, Vault, secrets e configurações de plataforma
* exclui criação e ACLs do role operacional `ai_readonly`
* `ai_readonly` permanece configuração operacional separada nesta proposta; não foi criado `roles.sql` nem adotado `--include-roles`
* ACLs operacionais excluídas: 1 grant de schema, 39 grants de functions, 21 grants de tabelas/views e 2 default privileges
* demais grants de `public` permanecem na migration; `service_role` mantém `USAGE` em `extensions` para uso de `pg_trgm`

### 12.5 Tratamento do legado

* os 15 arquivos foram preservados em `supabase/legacy-migrations/`
* nenhum conteúdo legado foi apagado
* `supabase/legacy-migrations/README.md` registra origem e proibição de uso no fluxo ativo
* `supabase/migrations/` contém somente a baseline proposta

### 12.6 Validação isolada

* ambiente: PostgreSQL 17.10 temporário, sem dados remotos
* dependências gerenciadas representadas por stubs mínimos de roles e `auth`
* aplicação da baseline: exit code `0`
* redump local não versionado: SHA-256 `10BD2AFC160BAB812624FB9736AB6855E762C9F0DCEE3310145862818A9CF397`
* comparação semântica remoto versus local, excluindo somente ACLs de `ai_readonly`: sem diferenças
* diferenças físicas restantes: somente 89 linhas em branco; nenhuma linha SQL não vazia
* cluster temporário removido e processos encerrados após a validação

### 12.7 Medição após a reorganização

* `supabase migration list --linked`: exit code `0`; somente `20260611172930` aparece como local
* `supabase db push --linked --dry-run`: exit code `0`; somente a baseline seria aplicada
* efeito local dos dois comandos: nenhum arquivo criado ou alterado

### 12.8 Drifts confirmados

* o legado não contém a estrutura inicial completa de `accounts`, `account_users`, `plans`, `partners`, `partner_accounts` e `audit_logs`
* o remoto contém 39 functions e 13 triggers, muito além dos objetos recriados pelo legado
* `account_taxonomy.source_type` remoto aceita `user_confirmed_ai`, ausente no legado e corrigido em `docs/schema.md`
* `account_niche_resolutions` remoto contém seis campos `user_*`, duas checks e uma FK ausentes do legado e corrigidos em `docs/schema.md`

### 12.9 Estado e próxima autorização

* baseline proposta e validada localmente
* histórico remoto ainda não alinhado
* nenhuma escrita remota executada
* gate de apply permanece desabilitado
* próximos comandos remotos de escrita continuam bloqueados: `migration repair`, `db push` real, migration de smoke e workflow de apply
* próxima decisão humana: revisar a baseline, o recorte de `ai_readonly` e autorizar ou rejeitar o alinhamento do histórico remoto

### 12.10 Classificação dos próximos comandos

* leitura remota autorizada: `supabase migration list --linked`
* dry-run autorizado: `supabase db push --linked --dry-run`
* escrita local reversível: revisão da migration, documentação e artefatos sanitizados
* escrita remota não autorizada: `supabase migration repair 20260611172930 --status applied`
* escrita remota não autorizada: `supabase db push --linked`
* escrita remota não autorizada: alteração de `SUPABASE_APPLY_MIGRATIONS_ENABLED`
* escrita remota não autorizada: execução do workflow de apply ou criação de branch Supabase

## 13) Encerramento definitivo de 12/06/2026

### 13.1 Evidências finais

* `main` confirmada no SHA `9098c1f38b6a6eccf9dab753f9ba55db68f61d2e`
* migrations ativas e registradas local e remotamente:
  * `20260611172930_remote_public_baseline.sql`
  * `20260612143820_migration_workflow_smoke_create.sql`
  * `20260612221253_migration_workflow_smoke_drop.sql`
* `supabase migration list --linked`: os três timestamps estão alinhados entre local e remoto
* `supabase db push --linked --dry-run`: `Remote database is up to date.`
* `public.migration_workflow_smoke`: ausente após a migration de remoção
* migration de criação: aplicada automaticamente após merge na `main`
* migration de remoção: aplicada automaticamente após merge na `main`
* `SUPABASE_APPLY_MIGRATIONS_ENABLED`: variável de repositório confirmada com valor `true`
* nenhuma credencial, connection string ou valor de secret foi registrado nesta lousa

### 13.2 Fluxo definitivo

* criar migrations em `supabase/migrations/<timestamp>_<nome>.sql`
* validar a migration e revisar `migration list --linked` e `db push --linked --dry-run`
* abrir PR exclusivo e aguardar merge humano na `main`
* o merge na `main` dispara o apply automático pelo workflow
* manter `SUPABASE_APPLY_MIGRATIONS_ENABLED = true` no fluxo normal
* não usar SQL Editor para alterações de schema no fluxo normal
* não editar, apagar, renomear ou substituir migration já aplicada
* fazer correções e reversões por nova migration incremental

### 13.3 Conclusão

* baseline oficial: ativa
* histórico remoto: alinhado
* legado: preservado fora do fluxo ativo
* workflow de apply: operacional
* smoke de criação e remoção: concluído
* pendências da fase baseline: nenhuma
