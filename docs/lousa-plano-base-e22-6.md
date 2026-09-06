# E22.6 — Remoção do Validador Final e automações adjacentes

Status: V1 funcional aprovada no Debate 07; execução Light; supervisão Autônoma.

Fonte aprovada: [Debate 07 — Remoção do Validador Final e automações adjacentes — LP Factory 10](https://docs.google.com/document/d/18SgNSLyqs1j-fk0IuM5hFlGrL_DJoFqW5WAlp4apPes/edit?usp=drivesdk), consultado em 06/09/2026.

## 1. Resultado esperado

- Retirar do projeto o Validador Final e o Niche Runtime Tests, junto com seus componentes exclusivos, sem afetar o produto, o CI, a mailbox institucional ou os dados já criados.

## 2. Comportamento e limites

- A retirada ocorre conjuntamente em um único plano e um único PR predominantemente de exclusão.
- Não é criada automação substituta neste recorte.
- A mailbox institucional e seus secrets permanecem disponíveis para a E17.9.3.
- Usuários, contas, memberships, sessões históricas e demais dados existentes no Supabase não são excluídos nem alterados.
- O produto, os gates vigentes e as automações sem dependência desses ativos permanecem fora da superfície de mudança.

## 3. Atores e supervisão

- O Executor inventaria consumidores, realiza a retirada, reconcilia a documentação e apresenta as evidências.
- Após o handoff, o fluxo segue sem supervisão rotineira do Estrategista original; ele permanece autoridade de escalada quando a execução não puder prosseguir dentro da autoridade concedida.
- Modo de supervisão aprovado: Autônomo.

## 4. Posição no roadmap e fases

- E22.6.1 — Inventariar consumidores e confirmar os limites da retirada.
- E22.6.2 — Remover conjuntamente os workflows, runtimes e verificadores exclusivos e reconciliar as referências documentais.
- E22.6.3 — Executar os gates, comprovar a ausência de referências quebradas e registrar a conclusão.
- As três fases pertencem a um único plano e não autorizam PRs adicionais por conveniência.

## 5. Classificação e automação

- Classificação do plano: Light.
- Automação do recorte: não automatizar; trata-se de retirada determinística e única.
- OpenAI: não aplicável neste recorte.

## 6. Critérios de aceite e evidências

- Validador Final e Niche Runtime Tests são removidos conjuntamente.
- Workflows, runtimes e verificador de uso exclusivo desses ativos são removidos.
- Busca completa não encontra imports, paths, scripts, comandos ou referências operacionais quebradas ligadas aos ativos removidos.
- A mailbox institucional e os secrets `MAILBOX_EMAIL` e `MAILBOX_PASSWORD` permanecem preservados e documentados para a E17.9.3.
- Nenhum usuário, conta, membership ou dado existente no Supabase é excluído ou alterado.
- Nenhuma automação, agente, rota, banco, job ou infraestrutura substituta é criada neste recorte.
- `docs/automations.md`, `docs/platform-config.md`, `docs/roadmap.md` e `docs/github-up.md` ficam reconciliados, sem instruções operacionais obsoletas.
- `npm ci` e `npm run check` são aprovados.
- Security Checks são aprovados e o diff final permanece predominantemente de exclusão, sem mudanças alheias ao objetivo.

## 7. Plano-base V2 técnico mínimo

Status: derivado da V1 congelada no commit `0f520d823676ab8d7494229f27b7a43597c629e9`, blob `e343bbc90a2674e9d17c32796c42755017998f94`, a partir da `main` `60cfe4289746b9bb118de15fb1b6955a4095326b`; pronto para implementação Light.

### 7.1. Boundary técnico e invariantes

- A retirada é repo-only e não cria substituto. Não alterar produto, runtime do Core, CI preservado, banco, schema, migrations, RLS, policies, usuários, contas, memberships, sessões, dados ou configuração externa.
- Preservar a mailbox institucional `lpfactoryqa@gmail.com` e os secrets GitHub `MAILBOX_EMAIL` e `MAILBOX_PASSWORD` como recursos da E17.9.3, embora seus consumidores atuais sejam retirados.
- Preservar `SUPABASE_DB_URL_READONLY`, `.github/workflows/pipeline-supabase-inspect.yml` e todo o restante de `automations/supabase-inspect/` fora do verificador exclusivo listado abaixo.
- Preservar `.github/workflows/security.yml` e todos os demais workflows, gates e automações sem dependência dos ativos retirados.
- Documentos canônicos só podem ser reconciliados pelo fluxo de `docs/prompt-abc.md`, com delta literal limitado às referências que se tornarem obsoletas.
- Referências históricas em planos já encerrados, histórico Git e PRs não são consumidores ativos e não devem ser reescritas.

### 7.2. E22.6.1 — Inventariar consumidores e confirmar os limites da retirada

- Confirmar por busca reprodutível todas as ocorrências dos nomes, paths, workflows, runtimes, comandos, imports, artifacts e verificador ligados ao Validador Final e ao Niche Runtime Tests.
- Classificar como alvos exclusivos os dois workflows, todo o subprojeto `automations/validador-final/`, todo o subprojeto `automations/niche-runtime-tests/` e `automations/supabase-inspect/verify-niche-runtime.mjs`.
- O Niche Runtime Tests depende de `automations/validador-final/run-niche-setup.mjs` e de seus helpers; por isso, a retirada deve permanecer conjunta.
- Confirmar que não há import, script raiz, gate automático ou consumidor do Core dependente desses paths. Se surgir consumidor necessário fora do inventário, parar antes da exclusão e devolver o conflito ao supervisor.

### 7.3. E22.6.2 — Remover conjuntamente os ativos exclusivos e reconciliar referências

- Excluir `.github/workflows/automation-validador-final.yml` e `.github/workflows/automation-niche-runtime-tests.yml`.
- Excluir todos os 12 arquivos versionados de `automations/validador-final/`.
- Excluir os dois arquivos versionados de `automations/niche-runtime-tests/`.
- Excluir somente `automations/supabase-inspect/verify-niche-runtime.mjs` dentro de `automations/supabase-inspect/`; preservar os demais arquivos desse subprojeto.
- Reconciliar por ABC somente `docs/automations.md`, `docs/platform-config.md`, `docs/roadmap.md` e `docs/github-up.md` para remover instruções operacionais obsoletas, registrar E22.6 e preservar a mailbox, os secrets e o contrato ainda pendente da E17.9.3.
- Em `docs/github-up.md`, preservar os identificadores `github#8` e `github#14`, mas atualizar suas evidências factuais para não afirmar que workflows e artifact retirados continuam ativos.
- Não ajustar `package.json` nem `package-lock.json` da raiz: o inventário não identificou script ou dependência raiz desses subprojetos isolados.

### 7.4. E22.6.3 — Validar e registrar a conclusão

- Executar `npm ci`, `npm run check`, `git diff --check` e busca final pelos nomes, paths, comandos, imports, artifact e verificador retirados.
- Confirmar que ocorrências remanescentes se limitam ao plano E22.6, a registros históricos preservados ou a catálogos cuja identidade normativa deva permanecer.
- Confirmar pelo diff que não existe migration, SQL, alteração de dado, configuração externa, secret, automação, agente, rota, job ou infraestrutura substituta.
- Publicar a branch e obter Security Checks do mesmo head remoto antes de declarar a entrega pronta para avaliação.
- Se um run for retido como potencialmente malicioso, aplicar a trava de `github#11`: revisar ator, evento, diff de workflows, permissões e secrets alcançáveis; não aprovar automaticamente nem tratar ausência de execução como aprovação.
- Os links de runs, checks, statuses, logs e artifacts do GitHub Actions são evidência suplementar e expirável. A prova durável da E22.6 deve permanecer no diff/PR e na reconciliação dos documentos canônicos, com inventário dos paths removidos e resultado da busca de referências. Não exportar artifacts, alterar a retenção do GitHub, criar workflow ou registrar secrets por causa deste plano.

### 7.5. Updates e decisão de derivação

- Skill acionada: `$lp-factory-avaliar-plano-updates`, parecer read-only sobre a V1 imutável.
- Update aplicado: `github#14`, somente como regra de evidência durável e reconciliação factual do catálogo.
- Trava aplicada: `github#11`, somente se houver run retido como potencialmente malicioso.
- Oportunidade condicional preservada sem implementação: `github#8`.
- Não há candidato a confronto estrutural, arbitragem funcional, decisão humana ou investigação adicional.
- O inventário confirma uma retirada determinística em boundaries existentes, sem nova arquitetura ou impacto funcional; a classificação Light permanece compatível e o Analista não é necessário antes da implementação.
