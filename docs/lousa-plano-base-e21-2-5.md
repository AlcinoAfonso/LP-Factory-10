23/08/2026 — Plano-base v1 — E21.2.5 — Catálogo administrável e UX compacta dos workloads OpenAI

## 1. Estado e decisões fixas

### 1.1. Estado

- Status: plano-base v1 consolidado após encerramento do debate humano.
- Caso macro: `E21 — Gestão e governança dos workloads OpenAI`.
- Recorte: `E21.2.5 — Catálogo administrável e UX compacta dos workloads OpenAI`.
- Plano conceitual: N/A.
- Este recorte é uma correção evolutiva da E21.2 já concluída; não reescreve nem invalida o plano-base histórico `docs/lousa-plano-base-e21-2-v2.md`.
- A E21.3 permanece prevista e não iniciada até a conclusão deste recorte.

### 1.2. Objetivo

- Separar a seleção operacional por workload da definição global de quais modelos e parâmetros podem ser oferecidos para novas candidatas.
- Permitir que `platform_admin` mantenha no Admin Dashboard um catálogo global de modelos disponível para seleção, sem exigir alteração de código, commit ou redeploy para adicionar ou indisponibilizar um modelo que use parâmetros já suportados pelo boundary.
- Preservar o lifecycle vigente da E21.2 por `ambiente + workload`: candidata → prova operacional → revisão validada → ativação humana → histórico/rollback.
- Simplificar a UX do Admin: catálogo compacto de modelos na parte superior e lista compacta de funções/workloads na parte inferior, com detalhe aberto somente quando necessário.

### 1.3. Fontes usadas

- `README.md`.
- `AGENTS.md`.
- `docs/prompt-estrategista.md` v32.
- `docs/roadmap.md`.
- `docs/template-roadmap.md`.
- `docs/lousa-plano-base-e21-2-v2.md`.
- `docs/base-tecnica.md`.
- `docs/platform-config.md`.
- `docs/schema.md`.
- `docs/openai-model-snapshot.md`.
- `lib/openai-workloads/registry.ts` e contratos públicos do boundary.
- `app/admin/(protected)/workloads-openai/`.
- Estado vigente da `main` após os merges da E19.5 até `c99dd7611e93ddfaaf1dc52fb729827156ede806`.

### 1.4. Decisões fixas do catálogo

- O catálogo é global para o produto e não é duplicado por Preview/Production; a disponibilidade define somente o que pode ser escolhido em novas candidatas.
- Preview e Production continuam independentes para candidata, prova, revisão, ativação e rollback.
- A autoridade de elegibilidade textual é a combinação `modelo + reasoning effort`; não existem duas allowlists independentes cuja combinação cartesiana possa gerar pares inválidos.
- A UX apresenta o catálogo por modelo e, dentro de cada modelo, os efforts permitidos/disponíveis.
- Para imagem, a mesma regra conceitual usa `modelo + quality`; `reasoning effort` não se aplica.
- O status do catálogo usa semântica de `Disponível para seleção` / `Indisponível para seleção`, e não `Ativo/Inativo`, para não confundir com a revisão ativa de um workload.
- Tornar um modelo ou parâmetro indisponível não interrompe uma revisão já ativa, não invalida histórico e não elimina rollback para revisão previamente validada; apenas impede seu uso em nova candidata enquanto estiver indisponível.
- Identidades de catálogo não são apagadas operacionalmente; modelos antigos são retirados de novas escolhas por indisponibilidade, preservando reprodutibilidade histórica.
- Um novo modelo adicionado manualmente nasce indisponível; somente `platform_admin` pode declarar os parâmetros suportados e torná-lo disponível para seleção.
- Não existe descoberta, sincronização ou ativação automática de modelos a partir da OpenAI.
- Novo valor de parâmetro ainda desconhecido pelo boundary — por exemplo um novo nome de `reasoning effort` não suportado pelo contrato atual — exige novo recorte técnico; este plano permite adicionar novos modelos que usem os parâmetros já suportados.
- O conjunto inicial textual preserva `gpt-5.4-mini` com `none | low | medium | high | xhigh` e inclui `gpt-5.6-luna`, `gpt-5.6-terra` e `gpt-5.6-sol` com `none | low | medium | high | xhigh | max`.
- O conjunto inicial de imagem preserva `gpt-image-2` com `quality = low | medium | high`.
- Os baselines e revisões ativas existentes não são alterados pelo bootstrap do catálogo.

### 1.5. Decisões fixas da UX

- A página `/admin/workloads-openai` mantém uma única superfície administrativa e não ganha nova rota neste recorte.
- Parte superior: catálogo compacto de modelos, separado visualmente por modalidade quando necessário, com nome, disponibilidade, resumo dos parâmetros e ação `Configurar`; adicionar modelo ocorre nessa área.
- A configuração detalhada de efforts ou qualities fica fechada por padrão e só aparece quando o humano abre/configura o modelo.
- Parte inferior: lista compacta das funções/workloads, preferencialmente uma linha por item e no máximo duas linhas responsivas, sem os cards extensos atuais na visão principal.
- A lista inferior possui cabeçalho sticky dentro da superfície de rolagem e deve permanecer legível sem overflow horizontal da página.
- A lista inferior usa nomes amigáveis para humanos e inclui uma coluna própria `Recorte`, por exemplo `E19.4`, para facilitar diálogo e rastreabilidade com IA.
- A coluna de configuração atual resume `modelo · parâmetro` do ambiente selecionado.
- A coluna `Imagem` exibe somente `Sim` ou `Não` na lista principal.
- A visão principal oferece seletor compacto `Preview | Production`, em vez de duplicar a lista inteira por ambiente.
- A ação `Abrir` expande o detalhe na própria página, sem criar rota adicional; apenas um detalhe precisa permanecer aberto por vez para preservar limpeza visual.
- O detalhe concentra configuração ativa, candidata, prova, ativação, rollback e histórico; lifecycle e histórico podem permanecer recolhíveis.
- Funções amigáveis podem agrupar mais de um workload técnico somente na apresentação. `Geração da Landing Page · E19.4` agrupa visualmente texto e imagem, mas `landing_page_draft_generation` e `landing_page_draft_image_generation` preservam configurações, revisões, provas, ativações e rollbacks independentes.
- Ao abrir `Geração da Landing Page`, o detalhe apresenta separadamente `Texto` (`model + reasoning effort`) e `Imagem` (`model + quality`).
- `supabase_inspect` permanece referência operacional read-only separada e não entra na lista de configurações mutáveis de produto.
- Nome amigável, recorte e agrupamento funcional permanecem metadados controlados pelo código; não são editáveis pelo catálogo operacional.

## 2. Contrato do caso

### 2.1. Fluxo do catálogo

- Gatilho: `platform_admin` abre a área superior do catálogo para revisar, adicionar ou alterar disponibilidade de um modelo.
- Entrada: modalidade, identificador do modelo, parâmetros suportados entre os valores já conhecidos pelo boundary e disponibilidade para novas seleções.
- Processamento: validar identidade/modalidade/shape → persistir ou atualizar a elegibilidade → projetar somente combinações disponíveis para novas candidatas dos workloads da mesma modalidade.
- Validação: impedir modelo sem parâmetro suportado, combinação incompatível com a modalidade, alteração por usuário sem `platform_admin` e qualquer operação que torne inválido o histórico já existente.
- Persistência: o catálogo usa a mesma residência operacional Supabase já adotada pela E21.2, sem segunda residência e sem depender de Vercel para mudanças ordinárias.
- Consumo: o Admin e as Server Actions de candidata consultam a projeção pública do catálogo; consumers de produto continuam resolvendo somente a revisão ativa do workload pelo boundary `lib/openai-workloads/`.
- Fallback: falha de leitura/validação do catálogo bloqueia criação/edição de nova candidata, mas não substitui nem derruba silenciosamente a revisão ativa já resolvível pelo lifecycle vigente.

### 2.2. Fluxo de configuração por workload

- Gatilho: o humano seleciona Preview ou Production e abre uma linha da lista de workloads.
- Entrada textual: workload técnico subjacente, ambiente, modelo disponível e effort disponível para esse modelo.
- Entrada de imagem: workload técnico subjacente, ambiente, modelo disponível e quality disponível para esse modelo.
- Processamento: salvar candidata → revalidar contra catálogo vigente → executar prova operacional existente → promover revisão validada → ativação humana explícita.
- Validação: combinação indisponível ou retirada do catálogo entre save e prova/promoção não pode ser promovida como nova revisão; concorrência e fail-closed existentes permanecem.
- Persistência: candidatas, revisões e ativações continuam no agregado operacional E21.2 já existente; o catálogo não substitui o histórico por workload.
- Consumo: a execução seguinte usa a revisão ativa por `ambiente + workload`, exatamente como na E21.2 atual.
- Fallback: nenhuma configuração nova é ativada automaticamente; falha preserva a configuração ativa anterior e o fallback funcional continua pertencendo ao consumer.

### 2.3. Compatibilidade e separação de responsabilidades

- O catálogo responde `quais combinações podem ser escolhidas agora`.
- O lifecycle E21.2 responde `qual revisão está ativa neste ambiente/workload e como ela muda com segurança`.
- A E21.3 continuará respondendo `qual combinação apresenta melhor custo-benefício segundo evidência reproduzível`.
- Indisponibilidade no catálogo não é kill switch de runtime e não altera revision snapshots históricos.
- A futura E21.3 pode comparar somente combinações que estejam disponíveis para novas candidatas no momento do teste, sem precisar alterar código para cada modelo já cadastrado.
- Nenhuma recomendação, benchmark ou resultado da E21.3 ativa configuração automaticamente.

### 2.4. Critérios de aceite

- O catálogo superior permite ao `platform_admin` adicionar modelo, definir parâmetros suportados entre os valores conhecidos e alterar disponibilidade sem commit/redeploy.
- Um modelo recém-adicionado nasce indisponível e não aparece nos seletores dos workloads até ação humana explícita de disponibilização.
- Desabilitar modelo ou parâmetro remove-o de novas candidatas, preservando configuração ativa, histórico e rollback existentes.
- Os workloads textuais passam a obter opções elegíveis do catálogo operacional, sem hardcode de Luna/Terra/Sol em cada workload como requisito para nova seleção.
- O conjunto inicial inclui Mini, Luna, Terra e Sol conforme a seção 1.4; imagem preserva GPT Image 2 e qualities vigentes.
- A lista principal mostra nome amigável, `Recorte`, configuração atual, `Imagem` e ação `Abrir`, com cabeçalho sticky e rows de no máximo duas linhas no layout responsivo.
- O seletor Preview/Production troca a leitura do ambiente sem misturar estados entre eles.
- A linha amigável de geração da LP exibe `Imagem = Sim`; ao abrir, texto e imagem aparecem como configurações técnicas independentes.
- Papéis negativos não conseguem ler controles privilegiados nem executar mutações; todas as mutações reexecutam `requirePlatformAdmin()` server-side.
- QA hospedado cobre desktop e mobile, header sticky, ausência de overflow de página, navegação por teclado, foco visível, labels/names, estados de sucesso/erro e touch targets proporcionais ao checklist WCAG 2.2 já adotado pelo projeto.
- Testes focais cobrem catálogo, disponibilidade, preservação de revisão ativa/histórica, nova candidata, mudança de disponibilidade durante lifecycle, agrupamento de LP e regressão dos resolvers existentes.
- Alterações de banco usam migration forward-only, testes SQL transacionais e snippet read-only; migrations já aplicadas não são editadas.
- `npm ci`, `npm run check` e `git diff --check` devem ser aprovados antes da entrega técnica.

## 3. Fases e próxima ação

### 3.1. E21.2.5 — Catálogo administrável e UX compacta dos workloads OpenAI

- Automação: não.
- Implementar a menor persistência operacional necessária no Supabase para catálogo global de modelos e parâmetros elegíveis, reutilizando a residência, segurança e boundary existentes da E21.2.
- Fazer a validação de novas candidatas depender do catálogo operacional sem enfraquecer snapshots, histórico, ativação, rollback ou fail-closed do lifecycle atual.
- Migrar o conjunto inicial de opções para Mini/Luna/Terra/Sol e GPT Image 2 conforme as regras deste plano, preservando os baselines ativos existentes.
- Reorganizar `/admin/workloads-openai` para catálogo compacto superior + lista compacta inferior + detalhe expansível, preservando a rota e os controles server-side existentes.
- Incluir metadados amigáveis de `Recorte` e agrupamento apenas apresentacional da geração textual+imagem da LP.
- Validar banco, código, UX hospedada e regressões da E21.2 antes de qualquer retomada da E21.3.
- Próxima ação após aprovação deste plano: avaliação única pelos especialistas prevista no processo do Estrategista; nenhuma implementação deve iniciar antes da consolidação/aprovação da v2.

## 4. Escopo negativo e critérios de parada

### 4.1. Fora de escopo

- Não iniciar benchmarking, ranking, vencedor ou comparação da E21.3.
- Não criar seleção automática de modelo, otimização automática, agente, job, workflow, cron ou automação recorrente.
- Não sincronizar automaticamente catálogo com endpoints, anúncios ou documentação da OpenAI.
- Não permitir texto livre para novos nomes de `reasoning effort` ou `quality` que ainda não pertençam ao contrato tipado do boundary; evolução do vocabulário de parâmetros exige recorte próprio.
- Não transformar indisponibilidade de catálogo em kill switch de revisão ativa.
- Não apagar modelos/revisões históricas para simplificar o catálogo.
- Não unir tecnicamente os workloads de texto e imagem da LP; o agrupamento é somente de apresentação.
- Não criar nova rota administrativa, segunda residência, cache, Realtime, AI Gateway, Vercel Flags ou Global Config.
- Não alterar prompts, schemas funcionais, payloads de negócio, domínio de LP, E19.4, E19.5, E20.6 ou consumers além do necessário para consumir a configuração resolvida existente.

### 4.2. Critérios de parada

- Parar se a solução exigir nova infraestrutura fora da residência Supabase e do boundary E21.2 já aprovados.
- Parar se a adição dinâmica de modelo exigir aceitar parâmetro desconhecido sem contrato tipado e validação determinística.
- Parar se a mudança de disponibilidade puder invalidar ou interromper uma revisão ativa existente.
- Parar se o agrupamento amigável da LP exigir compartilhar revisão, prova ou ativação entre texto e imagem.
- Parar diante de conflito material com o estado atual da `main`, migration já aplicada ou rollout operacional de outro recorte; reconciliar a fonte antes de mutar código ou banco.
