# Migrations legadas

Este diretório preserva, sem alteração de conteúdo, os arquivos que estavam em
`supabase/migrations/` antes da baseline oficial iniciada em 11/06/2026.

Esses arquivos cobrem apenas parte do histórico real do banco e não fazem parte
do fluxo ativo do Supabase CLI. Eles permanecem versionados para auditoria,
rastreabilidade e consulta durante a transição.

Origem:

- branch base: `origin/main`
- commit base: `a8ef6894011b13758cc9383ea9c2ffd8653b71ef`
- diretório original: `supabase/migrations/`
- quantidade preservada: 15 arquivos

Não mover estes arquivos de volta para `supabase/migrations/` nem aplicá-los ao
projeto remoto. O diretório ativo contém somente a baseline oficial proposta e,
depois da adoção aprovada, migrations incrementais novas.
