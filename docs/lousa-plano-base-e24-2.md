# E24.2 — Compatibilidade operacional e evidências temporárias

Status: V1 funcional aprovada no Debate 18; execução Light; supervisão Autônoma.

Fonte aprovada: [Debate 18 — Compatibilidade operacional, pendências transversais e governança do workflow de updates — LP Factory 10](https://docs.google.com/document/d/1-LS7MvQBZ7fyKOd3SQFSecBsynAAsEElrh1fcSrHZuY/edit), seção 4.2, revisão `ANLCKQmqDEuW8avQWTugxxzYDNqoDVLdxDSmnVOslkWGfSlhAN86ZIBOIbP59Y47h37pMtYN_9OSdnNJ35v_pgX_LEy79bAX8n0q3OB2aZo`, consultada em 22/09/2026.

## 1. Problema e resultado funcional

- Problema: `github#15`, `vercel#33` e `supa#71` possuem ações objetivas ainda não absorvidas operacionalmente.
- Resultado: validar Ubuntu 26.04, adequar a política de evidências Vercel e estabelecer a leitura manual dos Health Check Advisors, sempre sem custo incremental.
- Posição planejada no roadmap: E24.2 — Compatibilidade operacional e evidências temporárias.
- Classificação: Light, porque as ações são verificações proporcionais e ajustes documentais dentro dos contratos existentes.
- Automação: nenhuma nova; verificações manuais ou execução controlada dos workflows existentes.
- Dependência: PB-A, para aplicar o gate econômico e registrar corretamente o encerramento dos itens.
- Supervisão: Autônomo.

## 2. Fases planejadas

- E24.2.3 — validar os cinco workflows ou cobertura representativa aprovada no Ubuntu 26.04.
- E24.2.4 — absorver a retenção Vercel Hobby na política competente de evidências.
- E24.2.5 — estabelecer e comprovar o procedimento manual mínimo dos Health Check Advisors.
- E24.2.6 — atualizar o ciclo de vida dos três itens nos catálogos conforme o resultado real.

## 3. Critérios de aceite

- Compatibilidade com Ubuntu 26.04 comprovada ou pin temporário justificado, com correção e data de saída.
- Evidências Vercel não dependem de Preview além da retenção disponível e nenhum armazenamento paralelo foi criado.
- Procedimento manual do Supabase está documentado e não cria token, API, job, agente ou monitor.
- Disponibilidade sem custo incremental foi confirmada antes de cada ação.
- Cada item foi mantido ativo, encerrado ou devolvido ao radar futuro conforme evidência e critério de encerramento.

## 4. Escopo negativo

- O Ubuntu 26.04 será apenas testado. Se houver incompatibilidade, registrar o diagnóstico e parar; não corrigir código, dependências, workflows ou runners sem nova autorização humana.
- Não fixar runner nem alterar permanentemente GitHub Actions por antecipação.
- A retenção Vercel autoriza somente ajuste documental; não alterar plano, deployment, configuração ou armazenamento.
- Os Health Check Advisors serão inspecionados apenas manualmente; não criar token, integração com Management API, monitor, job, agente ou correção automática.
- Não contratar, ativar ou consumir recurso com custo incremental.
- Não alterar runtime, comportamento funcional, banco, schema, migration, rota, dependência ou infraestrutura da LP Factory.
- Cada PR deve conter somente alterações do PB-B; necessidade de correção ou ampliação fora deste escopo exige parada e decisão humana.

## 5. Estado da V1

- V1 funcional aprovada.
- Execução: Light.
- Supervisão: Autônomo.
- Dependência declarada: PB-A E24.1, satisfeita pela PR #963, merge commit `2a9d22378c42bd578ae320d15bb04d2dd513a60b`.
