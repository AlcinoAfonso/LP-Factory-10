0. Introdução

0.1 Cabeçalho
- Data: 17/10/2026
- Versão: v1.5
- Status: nenhum service/MCP operacional.

0.2 Função do documento
- Catálogo de services implantáveis, MCPs, endpoints e infraestrutura reutilizável com identidade própria, sem secrets.

0.3 Relação com outros documentos
- Automações: `docs/automations.md`; plataformas e configuração externa: `docs/platform-config.md`; regras técnicas: `docs/base-tecnica.md`; evolução: `docs/roadmap.md`.

1. Catálogo de services

1.1 Estado atual da camada
- Nenhum service implantável ou MCP operacional. Projeto `lpf-10-services` removido, sem configuração externa remanescente; estado em `docs/platform-config.md` — 3.2.
- `automations/supabase-inspect/` é automação GitHub read-only, preservada em `docs/automations.md` — 3.1.

2. Regras de fronteira desta camada
- Catalogar somente services com identidade própria e referências técnicas locais; demais assuntos seguem as residências de 0.3.

3. Observação de manutenção
- Catálogo curto aqui; detalhes técnicos no README local do service.
- Deploy independente compartilhando repositório com o Core exige boundary operacional explícita: projeto Vercel, Root Directory e regras de build.

99. Histórico
- Git e PRs do repositório.
