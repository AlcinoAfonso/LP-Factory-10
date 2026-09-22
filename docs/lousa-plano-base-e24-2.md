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

## 6. Plano-base V2 técnico mínimo

Status: derivado da V1 congelada no commit `110ee5c345b1ca8680d76b08df7209f17ccd7e2f`, blob `838805c68a288700fdbc7b1072dfb2d5c4f9b57d`, a partir da `main` `8d297be1a35bb316fa81a53ff222c5b31c8242d9`; consolidado para implementação Light sem gate adicional do Analista.

### 6.1. Boundary técnico e invariantes

- Executar somente as quatro fases E24.2.3 a E24.2.6, na ordem aprovada, sobre `github#15`, `vercel#33` e `supa#71`.
- Confirmar zero custo incremental imediatamente antes de cada ação. Gratuidade ausente, upgrade, cobrança adicional ou recurso não disponível interrompem somente o caminho afetado e mantêm o item ativo.
- Manter o PR final exclusivamente documental, sem diff de workflow, runner, dependência, código, configuração ou infraestrutura.
- Não executar literalmente workflows com efeitos externos. A prova Ubuntu 26.04 exclui secrets, OpenAI, Supabase remoto, migrations, criação de PR, commit, push, alteração de dependências, upload de artifact e cache adicional.
- Não alterar Vercel. Preview e deployment histórico são tratados somente como evidência suplementar e expirável.
- Consultar Supabase somente pelo Studio, de forma manual, sem token, Management API, MCP, SQL, monitor, job, agente, automação ou correção.
- Preservar IDs e registros históricos dos catálogos; encerrar somente o item cujo critério tenha evidência factual suficiente.
- Se a validação Ubuntu 26.04 falhar, registrar diagnóstico e parar esse caminho sem pin nem correção; as demais fases independentes continuam.

### 6.2. E24.2.3 — Compatibilidade representativa no Ubuntu 26.04

- Usar um único workflow de validação efêmero, acionado no PR do PB-B e removido antes do diff final, com `runs-on: ubuntu-26.04` em runner padrão do repositório público.
- Cobrir todas as classes dependentes do runner presentes nos cinco workflows vigentes: Bash e `grep`; `actions/checkout`; `actions/setup-node`; Node 20 com `npm ci` e `npm run check` em `automations/docs-apply-report` e `automations/supabase-inspect`; Node 22 com instalação limpa, `npm run check` e build hospedado do Core; e `supabase/setup-cli` na versão fixada, limitado a `supabase --version`.
- Não disponibilizar secrets ao workflow de validação e não executar chamadas OpenAI, `supabase link`, `supabase db push`, criação de PR, commit, push ou alteração de dependências.
- Exigir que a evidência hospedada identifique Ubuntu 26.04 e aprove todas as classes. Remover o arquivo efêmero e comprovar que ele não aparece em `main...HEAD` antes da entrega.
- Se qualquer classe falhar, preservar os logs do run enquanto disponíveis, registrar no PR e no catálogo o diagnóstico objetivo e parar o caminho Ubuntu; não aplicar correção nem pin.

### 6.3. E24.2.4 — Política de evidências Vercel Hobby

- Produzir relatório factual para a triagem ABC registrando que URLs de Preview e deployments históricos da Vercel são evidências operacionais suplementares e expiráveis; nenhum encerramento pode depender exclusivamente de sua disponibilidade.
- Registrar no documento operacional competente que o plano Hobby preserva os três deployments de produção mais recentes e os três deployments mais recentes de qualquer tipo, além das exceções vigentes da plataforma; confirmar a regra quando uma retenção específica for material.
- Preservar PR, commit, roadmap e documentos canônicos competentes como prova durável, sem upgrade, proteção rotineira, storage paralelo ou alteração em plano, deployment, alias, retenção ou configuração.
- Aplicar delta em `docs/base-tecnica.md` somente se o ABC final confirmar que a regra supera o gate de durabilidade e reuso; caso contrário, registrar `SEM ALTERAÇÕES NECESSÁRIAS` e residir somente no documento competente.

### 6.4. E24.2.5 — Procedimento manual dos Health Check Advisors

- Abrir o projeto `LP-Factory-10` no Supabase Studio, acessar Advisors → Health e registrar data/hora da observação e os estados apresentados para Data API/PostgREST, Auth, Storage e Edge Functions.
- Usar somente o refresh manual do painel. Resultado vazio significa verificações executadas sem achados; `advisor_check_unavailable` significa verificação indisponível e nunca estado saudável.
- Tratar qualquer achado apenas como sinal de investigação a correlacionar com horário, release, logs seguros e comportamento observado; não inferir causa nem autorização de correção.
- Documentar o procedimento reproduzível no documento operacional competente, sem secret, dado sensível, token, API ou automação.
- Se o painel não estiver disponível, registrar diagnóstico e parar esse caminho sem upgrade ou implementação substituta.

### 6.5. E24.2.6 — Ciclo de vida dos três itens

- Após as evidências reais, atualizar `github#15`, `vercel#33` e `supa#71` nos respectivos catálogos, preservando cada ID e seu histórico.
- Encerrar somente o item cujo critério esteja integralmente comprovado; falha, indisponibilidade ou evidência incompleta mantêm o item ativo com estado, ação pendente, prioridade, motivo, gatilho e critério de encerramento.
- Confrontar os estados dos catálogos com o PR, o roadmap e as evidências operacionais; não converter ausência de achado em indisponibilidade nem indisponibilidade em saúde.

### 6.6. Updates e decisão de derivação

- Skill acionada: `$lp-factory-avaliar-plano-updates`, com parecer read-only sobre a V1 imutável.
- Veredito: `updates aplicáveis com patches autossuficientes`.
- Aplicar agora: `github#15`, `vercel#33` e `supa#71`.
- Referências/travas: `github#14` para evidência operacional expirável; `prod#16` para QA em Preview sem torná-lo prova durável.
- Rejeitado no recorte: `vercel#21`, porque storage paralelo viola o escopo e adiciona dependência, manutenção e custo sem ganho necessário.
- Oportunidade futura não implementada: `supa#70`, condicionada a recorrência comprovada, acesso read-only validado, custo conhecido e superioridade frente ao procedimento manual.
- Não há candidato a confronto estrutural, arbitragem funcional, investigação adicional ou decisão humana.
- O Analista não é necessário: os patches são documentais e de validação isolada, sem impacto funcional, estrutural ou dúvida residual de escopo; falha da prova Ubuntu possui resposta fail-closed definida.

### 6.7. Validação e triagem ABC final

- Validar o run hospedado Ubuntu 26.04, a remoção do workflow efêmero e a ausência de qualquer outro delta transitório no diff final.
- Executar buscas estáticas pelos contratos de evidência Vercel, procedimento Supabase e estados dos três catálogos; executar `git diff --check` e revisar `main..HEAD` e `main...HEAD`.
- Como o diff final é exclusivamente documental, `npm ci` e `npm run check` são não aplicáveis ao recorte; a instalação, os checks e o build dentro do run Ubuntu 26.04 são evidência operacional focal, não validação local de código alterado.
- Preparar relatório factual consolidado e executar `$lp-factory-abc` em `ETAPA: consolidação final` para todos os documentos canônicos potencialmente afetados, no mínimo `docs/roadmap.md`, `docs/base-tecnica.md`, `docs/platform-config.md`, `docs/automations.md`, `docs/services.md`, `docs/schema.md` e `docs/design-system.md`.
- Aplicar somente operações literais emitidas pelo ABC no documento competente e registrar `SEM ALTERAÇÕES NECESSÁRIAS` para cada documento sem delta.
- Não alterar `docs/base-tecnica.md` antes ou fora do ABC; só aplicar delta se a triagem identificar regra técnica durável e reutilizável.
