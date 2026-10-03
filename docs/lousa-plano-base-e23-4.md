# PB 18B.1 — Patch de segurança do Next.js

Fonte funcional aprovada: [Debate 18B, seção 4.3](https://docs.google.com/document/d/1d4dIMrQHG_Qo82RdFYZrirbpFRYoHlLESMA9wXKuXzg/edit). A V1 abaixo reproduz o recorte aprovado; este commit a congela antes de qualquer derivação técnica.

## 1. V1 aprovada

### 1.1 Objetivo e resultado

- Aplicar ao Core a release de segurança oficial do Next.js 16.3.8, hoje publicada para a linha 16.3, substituindo a versão fixada 16.3.3.
- Preservar jornadas, rotas e comportamento atuais; o resultado é uma dependência corrigida, sem funcionalidade nova para o cliente.

### 1.2 Escopo, limites e riscos

- Incluir `next` e `eslint-config-next` alinhados a 16.3.8, o `package-lock.json` e somente ajustes técnicos indispensáveis para manter compatibilidade sem alterar comportamento.
- Excluir upgrades de React e outras dependências sem necessidade comprovada, recursos opcionais do Next.js, mudanças funcionais, banco/schema/migrations, workflows, secrets, settings, plano, serviços ou infraestrutura.
- A release 16.3.8 corrige sete vulnerabilidades da divulgação de setembro. Duas outras vulnerabilidades (uma crítica e uma alta) seguem pendentes de coordenação upstream; este plano não declara remediação total e `vercel#34` permanece ativo para acompanhá-las.
- Risco principal: regressão de compatibilidade no Core após o patch. Qualquer correção que exija ampliar o escopo volta ao titular para decisão.

### 1.3 Roadmap, custo e automação

- Posição prevista: E23.4, dentro de Segurança e governança transversal da plataforma; fase única 23.4.3 — aplicar e validar o patch de segurança Next.js.
- Custo incremental zero: atualizar a dependência existente e usar os GitHub Actions e a Vercel Hobby já configurados; não criar ou contratar recurso. Se surgir necessidade de upgrade ou cobrança, interromper.
- Automação: não criar automação nova; usar os checks de segurança e o Preview existentes.
- Supervisão: Autônomo; a sessão principal executa pelo contrato único do Executor.

### 1.4 Critérios de aceite e evidências

- Instalação limpa (`npm ci`), `npm run check` e Security Checks existentes aprovados no mesmo HEAD.
- Build hospedado e Preview da Vercel concluídos com sucesso; smoke proporcional em superfícies representativas confirma ausência de erro visível ou regressão de runtime.
- Code Review independente concluído no HEAD exato, sem achado material pendente; merge somente após os gates. O deploy automático de Production já configurado fica Ready, sem alteração manual de settings.
- Reconciliar `vercel#34`, manter as duas vulnerabilidades ainda sem patch como pendência upstream, registrar E23.4 no roadmap e materializar a V1 neste arquivo. Concluir PB 18B.1 somente com PR, validação pós-merge e registros canônicos conferidos.

### 1.5 Fontes indicadas no Debate

- Catálogo `docs/vercel-up.md` (`vercel#34`), README.md, docs/roadmap.md, docs/base-tecnica.md, docs/platform-config.md, AGENTS.md e contratos vigentes do Pipeline; release Next.js oficial ligada na seção 1.3 do Debate 18B.

## 2. Autoridade e limites do recorte

- O usuário aprovou a V1 descrita no Debate 18B, seção 4.3, e autorizou execução autônoma nesta sessão principal, inclusive PR, merge após os gates obrigatórios e deploy decorrente do fluxo já configurado.
- A autorização cobre somente atualizar Next.js para 16.3.8, alinhar a configuração ESLint correspondente e o lockfile, validar e reconciliar `vercel#34`.
- Não estão autorizados alterações de settings, plano, secrets, workflows, banco, migrations, outros itens, comportamento do produto ou dependências além das necessárias à compatibilidade. As verificações de `supa#56`, `github#10` e `github#13` permanecem pendentes de decisão própria.
- O gate de custo incremental zero foi conferido no Debate: dependência existente, GitHub Actions já configurados e Vercel Hobby; sem serviço, recurso pago, plano ou infraestrutura nova. Parar se a execução exigir upgrade ou cobrança incremental.

## 3. V2 candidata — derivação técnica mínima

### 3.1 Referências imutáveis e estado de origem

- V1 congelada: commit `0e04c8ef5dc81d4bc9bf6373f691d5b5b478feaf`, blob `1189740a69ea869375c150f95e7476464050419b`, path `docs/lousa-plano-base-e23-4.md`, seções 1–2.
- Base `main` usada pelo recorte: commit `6acc3b1027e1f197203a0f196eaf8503fabf7fac`.
- Snapshot imutável de `docs/roadmap.md` antes de reconciliar E23.4: commit `6acc3b1027e1f197203a0f196eaf8503fabf7fac`, blob `ae8446498be5540ec6c2a28725eee5c75187acbd`. O estado E23.1–E23.3 e seu conteúdo completo permanecem recuperáveis nesse path, commit e blob; a E23.4 será acrescentada sem reabrir recortes concluídos.
- `source_repository_sha` da avaliação de Updates: `0e04c8ef5dc81d4bc9bf6373f691d5b5b478feaf`, o commit da V1 congelada e dos quatro catálogos examinados.
- Plano conceitual separado: N/A; a fonte funcional competente é o Debate 18B, seção 4.3.
- Roadmap vigente na base: macro E23 com E23.1, E23.2 e E23.3 concluídas; E23.4 é o próximo recorte disponível.

### 3.2 Decisão técnica e classificação

- **Derivação técnica da V1:** atualizar somente `next` e `eslint-config-next` de `16.3.3` para `16.3.8`, fixados exatamente, e alinhar `package-lock.json` pela resolução npm necessária.
- **Modernização técnica justificada:** aplicar a release de segurança `vercel#34` à dependência existente, preservando comportamento. É um patch direto, de impacto estrutural baixo e sem impacto funcional planejado; o ganho é evitar manter o baseline anterior às sete correções publicadas.
- Manter `vercel#34` ativo depois deste recorte para acompanhar as duas vulnerabilidades ainda pendentes de coordenação upstream (uma crítica e uma alta). Não afirmar remediação total.
- Trava: `vercel#29` não autoriza Cache Components, `instant()`, Instant Navigations, prefetch customizado, alteração de cache/fetch ou reescrita de rotas neste plano. Sem rota e ganho medido, permanece condicional.
- Não atualizar React nem outras dependências; não alterar código de produto, rotas, configuração, workflow, banco, migrations, secrets, settings, plano ou infraestrutura. Não executar `.github/workflows/upgrade-next-16-1-1.yml`, helper manual legado.
- O workflow `.github/workflows/security.yml` valida padrões de fluxo implícito em `app/` e `src/`; sua aprovação é um gate existente, não prova isolada de que advisories de dependências foram encerrados.

### 3.3 E23.4.3 — Atualização e validação do Core

- Antes da instalação, conferir no mesmo estado da branch a disponibilidade de `next@16.3.8` e `eslint-config-next@16.3.8` no registry. Se qualquer pacote não estiver publicado ou exigir upgrade/custo não aprovado, parar sem ampliar escopo.
- Fixar ambos em `16.3.8` e atualizar `package-lock.json` com npm. Revisar o diff: aceitar somente mudanças transitivas necessárias a esses dois pins; manter todas as demais dependências inalteradas.
- Executar nesta ordem: `npm ci`; confirmar `npm ls next eslint-config-next --depth=0`; executar `npm run check`; executar `git diff --check`. Não executar `npm run build` no sandbox.
- Publicar a branch no gate remoto; exigir `Security Checks` existentes no mesmo HEAD e build hospedado da Vercel bem-sucedidos.
- Validar o Preview do mesmo HEAD com smoke proporcional: entrada pública, autenticação, rota protegida/SSR representativa, navegação e renderização de imagem disponível. Confirmar ausência de erro visível ou regressão de runtime; observar os sinais de erro existentes no Preview. Não criar contas, workflows, logging ou instrumentação novos.
- Após merge pelos gates vigentes, confirmar o deployment automático de Production `Ready`, registrar PR/merge commit e evidências, reconciliar os documentos e atualizar o Debate 18B.
- **Observabilidade:** N/A para nova instrumentação; a mudança não introduz rotas, eventos ou comportamento observável novo. Erros visíveis e sinais existentes do Preview fazem parte do smoke.

### 3.4 Roadmap, registros e limites de parada

- Reconciliação de planejamento: acrescentar E23.4 ao macro E23 conforme `docs/template-roadmap.md`; criar 23.4.1 (objetivo/status) e 23.4.3 (atualização e validação), sem seção vazia de registros antes de haver entrega material.
- Após validação e merge, preencher 23.4.2 com os arquivos efetivamente ajustados (`package.json`, `package-lock.json`, catálogo `docs/vercel-up.md` e registros do plano, quando aplicáveis) e atualizar 23.4.3 para o estado comprovado, sem alterar E23.1–E23.3.
- Reconciliar `vercel#34` com as fontes oficiais: a release `16.3.8` foi publicada em 30/09/2026 e inclui sete correções; duas vulnerabilidades (uma crítica e uma alta) aguardam coordenação upstream. Registrar `https://nextjs.org/blog/upcoming-nextjs-security-release-september-2026` e `https://github.com/vercel/next.js/releases/tag/v16.3.8`. O item continua ativo para as duas pendências.
- Se `npm ci`, `npm run check`, Security Checks, build ou smoke falhar, corrigir somente incompatibilidade técnica dentro da V1 e repetir o gate afetado no novo HEAD. Se a correção exigir mudança funcional, dependências fora do escopo, custo, upgrade de plano ou alteração operacional, parar e devolver a decisão ao titular.
- Não criar matriz de consolidação: Updates concluiu patches autossuficientes, sem confronto estrutural, arbitragem funcional ou investigação bloqueante.

### 3.5 Estado da V2

- V2 técnica candidata, derivada da V1 congelada e do parecer read-only do Gestor de Updates; aguarda avaliação independente do Analista antes da implementação.
- A avaliação de Updates apontou aplicação direta de `vercel#34`, preservação condicional de `vercel#29` e não aplicabilidade de `vercel#27`/`vercel#31` a este recorte. Não há confronto estrutural ou arbitragem funcional.
- Supervisão Autônoma; execução mínima e proporcional, sem categoria Light/Complexa conforme o Pipeline vigente.
