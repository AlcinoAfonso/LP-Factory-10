# Plano-base E23.3 — Retenção proporcional das evidências GitHub Actions

## V1 funcional aprovada

### 12.1. Problema e resultado

- Problema: checks, runs, statuses, logs e artefatos do GitHub Actions são temporários, mas não existe regra explícita separando prova durável de evidência operacional efêmera.
- Resultado funcional: a conclusão de cada recorte permanece rastreável por PR, commit e roadmap, enquanto evidências brutas podem expirar sem comprometer a comprovação do resultado.

### 12.2. Atores e comportamento esperado

- Atores afetados: mantenedores, Estrategista, executores e revisores.
- Comportamento esperado: a validação consulta logs e artefatos enquanto disponíveis, mas o encerramento funcional não depende de sua permanência futura.

### 12.3. Limites, riscos e dependências

- Escopo negativo: não criar armazenamento externo, exportação recorrente, job, agente, nova automação ou arquivo paralelo de evidências.
- Risco funcional material: um documento depender exclusivamente de artefato expirável e perder sua prova de conclusão.
- Dependências reais: workflows atuais, PRs, commits, roadmap e contratos de entrega do projeto.
- Se surgir exigência comprovada de preservar evidência bruta além da janela, interromper este plano e reabrir a decisão com o Gestor de Automações e o humano.

### 12.4. Posição e fase planejadas no roadmap

- Caso macro planejado: E23 — Segurança e governança transversal da plataforma.
- Plano-base: E23.3 — Retenção proporcional das evidências GitHub Actions.
- Estrutura planejada: 23.3.1 Objetivo e status; 23.3.2 Registros do recorte quando houver entrega material; 23.3.3 Contrato de evidência durável e expiração.
- Fase 23.3.3: assegurar que o fechamento dos recortes permaneça verificável sem depender de logs ou artefatos expirados.

### 12.5. Classificação e automação

- Execução: Light, porque a regra usa as fontes e os workflows existentes e não cria residência adicional.
- Automação: não criar automação; a possibilidade de exportação recorrente foi excluída desta V1.

### 12.6. Aceite e evidências

- Critério de aceite: workflows e referências documentais relevantes inventariados.
- Critério de aceite: nenhum estado final depende exclusivamente de run, check, status, log ou artefato que possa expirar.
- Critério de aceite: a conclusão durável fica registrada nas fontes competentes, e a expiração das evidências brutas é aceita como comportamento normal.
- Evidências esperadas: inventário sanitizado, regra documentada no contrato competente e amostra de rastreabilidade por PR, commit e roadmap.

### 12.7. Estado da V1

- V1 funcional aprovada. Execução: Light. Supervisão: Autônomo.

## Referência da fonte aprovada

- Documento: “Debate 06 — Implementações transversais prioritárias — LP Factory 10”.
- Seção: 12 — V1 funcional aprovada — E23.3 Retenção proporcional das evidências GitHub Actions.
- URL: https://docs.google.com/document/d/1HvHycy9dHY2GdnrChVjhuqrtqk3TCRT7cd5iS9v1dhs/edit
- Documento consultado em: 06/09/2026.

## V2 mínima técnica

### 1. Contrato e referências imutáveis

- Execução: Light.
- Supervisão: Autônomo.
- V1 congelada no commit `2c8c3dcd613f4ab2d6ddbf956cf077ac9112d1bd`.
- Blob imutável da V1: `0169a6b23bbad73a1b2ece6302bad009d8ed52b2`.
- A V2 preserva integralmente resultado, limites, fase e critérios de aceite da V1.

### 2. Investigação factual

- Repositório: `AlcinoAfonso/LP-Factory-10`, público, com cinco workflows vigentes em `.github/workflows/`.
- Configuração lida sem alteração em GitHub → Settings → Actions → General em 06/09/2026: `Artifact and log retention = 90 days`; a própria superfície informa máximo de 90 dias.
- Metadados sanitizados de artefatos confirmam expiração em 90 dias. Os únicos artefatos encontrados usam o nome histórico `niche-runtime-results`; seu workflow produtor foi retirado pela E22.6 e nenhum workflow vigente usa `upload-artifact`.
- A partir de 01/10/2026, conforme `github#14`, checks, workflow runs e commit statuses passam a seguir a mesma configuração de retenção de artefatos e logs; registros já expirados não são restaurados por aumento posterior da janela.

### 3. Inventário de workflows e evidências

| Workflow vigente | Evidência operacional efêmera | Residência durável do resultado |
| --- | --- | --- |
| `.github/workflows/security.yml` | check, run e logs do job | PR e commit validados; regra técnica em `docs/base-tecnica.md` |
| `.github/workflows/pipeline-supabase-apply-migrations.yml` | run, status, logs e Job Summary | migration versionada, commit/PR e estado do caso no roadmap/documentos canônicos |
| `.github/workflows/pipeline-supabase-inspect.yml` | run e logs da inspeção | conclusão incorporada ao PR/commit e ao documento canônico competente quando produzir decisão durável |
| `.github/workflows/pipeline-docs-apply-report.yml` | run, logs e Job Summary | branch, commit e PR criados pelo próprio fluxo; documento alterado após merge autorizado |
| `.github/workflows/upgrade-next-16-1-1.yml` | run, status e logs | alterações versionadas e commit enviado à branch alvo; PR/roadmap quando o recorte for concluído |

- Nenhum workflow vigente produz artefato por upload.
- Nenhum resultado final exige preservar evidência bruta além da janela efetiva.
- `docs/automations.md` descreve consumidores e comportamento operacional; `docs/platform-config.md` mantém o inventário/configuração dos workflows; `docs/base-tecnica.md` governa CI e validação; `docs/roadmap.md` mantém o estado final dos casos; `docs/github-up.md` preserva o update `github#14`.

### 4. Updates

- Skill obrigatória executada: `lp-factory-avaliar-plano-updates`.
- Referência avaliada: V1 no commit `2c8c3dcd613f4ab2d6ddbf956cf077ac9112d1bd`.
- Veredito: `updates aplicáveis com patches autossuficientes`.
- `github#14`: aplicar agora como contrato normativo de evidência durável e configuração operacional, sem alterar settings ou workflows.
- `vercel#21`: oportunidade estratégica condicional, expressamente fora da implementação. Só pode ser reaberta se surgir obrigação comprovada de reter evidência bruta além da janela do GitHub, com decisão humana e Gestor de Automações.

### 5. Delta executável

1. Em `docs/base-tecnica.md`, seção 3.4, registrar que runs, checks, commit statuses, logs, Job Summaries e artefatos do GitHub Actions são evidências operacionais suplementares e expiráveis; nenhum encerramento pode depender exclusivamente deles; PR, commit, roadmap e documentos canônicos competentes preservam a prova durável.
2. Em `docs/platform-config.md`, seção 2.2, registrar o setting observado de 90 dias, seu máximo público, a abrangência agendada para 01/10/2026 e a irreversibilidade da expiração, sem alterar a plataforma.
3. Em `docs/roadmap.md`, criar E23 e o recorte E23.3 com os identificadores `23.3.1`, `23.3.2` e `23.3.3`, registrar a entrega documental e a amostra de rastreabilidade E22.6.
4. Em `docs/github-up.md`, preservar `github#14` como registro histórico implementado pela E23.3, retirando somente a pendência já resolvida.
5. Não alterar workflows, settings, secrets, runtime, banco, `docs/automations.md` nem criar residência paralela.

### 6. Amostra de rastreabilidade

- Recorte amostrado: E22.6 — Remoção do Validador Final e automações adjacentes.
- PR durável: `https://github.com/AlcinoAfonso/LP-Factory-10/pull/905`.
- Commits duráveis: V1 `0f520d823676ab8d7494229f27b7a43597c629e9`, V2 `e716b4f8187c94fb94edd70d5d5c18dc865a7735`, implementação `dee4a904d6f221bc141912f74b79599564322f4e` e merge `af82e672d4f6e02edb2bfabe2bf5bed500a429ea`.
- Roadmap durável: `docs/roadmap.md`, seção 22.6.
- A conclusão continua verificável por essas fontes mesmo que o check `Security Checks`, o run, o status e os logs correspondentes expirem.

### 7. Validação e aceite

- Repetir o inventário dos workflows e confirmar ausência de `upload-artifact` e `retention-days` nos workflows vigentes.
- Buscar referências documentais a GitHub Actions, runs, checks, statuses, logs, Job Summaries e artefatos e confirmar que nenhum estado final afetado depende exclusivamente delas.
- Aplicar a reconciliação dos documentos canônicos por `docs/prompt-abc.md`, com `docs/template-roadmap.md` para o roadmap.
- Executar `git diff --check` e revisar `main..HEAD` e `main...HEAD`.
- `npm ci` e `npm run check`: não aplicáveis ao delta exclusivamente documental.
- Publicar um único PR sem merge e confirmar o check remoto aplicável.
