# Evidências versionadas da baseline Supabase

Metadados estruturais read-only gerados em 11/06/2026 durante a preparação da
baseline.

## Arquivos

- `inventory/*.json`: metadados read-only de schemas, extensions, colunas,
  constraints, índices, views, functions, triggers, policies e estado do
  histórico remoto.

O único arquivo ativo para o Supabase CLI é:

`supabase/migrations/20260611172930_remote_public_baseline.sql`

Os dumps de origem e validação não são versionados porque repetem integralmente
o schema já representado pela migration. Evidência preservada localmente:

- dump remoto `public`: SHA-256
  `1848538E440E9FA4F1511FCFA6AFF8A5BEA1C654EC9047EC33830C36B13AD451`;
- redump local validado: SHA-256
  `10BD2AFC160BAB812624FB9736AB6855E762C9F0DCEE3310145862818A9CF397`;
- comparação semântica, ignorando somente ACLs de `ai_readonly` e linhas em
  branco: sem diferenças.

## Escopo

Incluído:

- objetos próprios em `public`;
- metadados e ACLs de `public`, exceto `ai_readonly`;
- dependência explícita de `pg_trgm` na migration ativa.

Excluído:

- dados de negócio;
- schemas gerenciados `auth`, `storage`, `realtime`, `graphql` e `vault`;
- conteúdo de buckets e objetos;
- Vault e secrets;
- configurações do projeto e da plataforma;
- criação, credencial, ACLs e default privileges do role `ai_readonly`.

O role `ai_readonly` permanece classificado nesta proposta como configuração
operacional separada. Não foi criado `supabase/roles.sql` e o workflow não foi
alterado para usar `--include-roles`.

Os inventários de roles, grants e default privileges foram mantidos apenas como
evidência local temporária e não são versionados. A revisão confirmou:

- `ai_readonly` é um role operacional de inspeção read-only;
- foram excluídas da baseline 63 ACLs: 1 grant de schema, 39 grants de
  functions, 21 grants de tabelas/views e 2 default privileges;
- os demais grants de `public` permanecem representados na migration;
- `service_role` possui `USAGE` no schema `extensions`, necessário aos objetos
  de `pg_trgm`;
- nenhum valor de credencial foi coletado ou persistido.

## Segurança

Os arquivos versionados foram verificados contra padrões de connection string,
password, token, host temporário e credenciais da CLI. Nenhum valor de
autenticação foi versionado.
