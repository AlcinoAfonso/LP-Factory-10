# Plano-base E20.6 — Avaliação de suficiência factual da E20.2 por taxon

- Data: 14/08/2026.
- Versão: v1.
- Status: plano-base v1 consolidado para avaliação única dos especialistas; execução ainda não autorizada.
- Recorte previsto para roadmap: `20.6 — Avaliação de suficiência factual da E20.2 por taxon`.
- Path canônico: `docs/lousa-plano-base-e20-6.md`.
- Processo: `docs/prompt-estrategista.md` v30.
- Plano conceitual: `docs/lp-planejamento.md`, preservado como contexto; a decisão humana de 14/08/2026 redefine somente os critérios anteriores à E19.3 tratados neste recorte.
- Dependência: E20.5 concluída para o taxon avaliado, com pesquisa integral `end_customer` selecionada e válida.

## 1. Estado e decisões fixas

### 1.1. Problema e resultado esperado

- A E20.2 define e resolve o catálogo factual declarativo de entradas por taxon e plano, mas sua existência não prova que os fields atuais sejam suficientes para sustentar a geração de LPs de cada novo taxon.
- O projeto precisa de uma avaliação explícita por taxon antes da E19.3, sem tornar obrigatória uma camada E20.2 específica para cada taxon e sem transformar a pesquisa integral em catálogo.
- O resultado deste recorte é registrar qual versão executável da E20.2 foi efetivamente avaliada para o taxon e considerada suficiente.
- Com E20.5 válida e E20.6 válida, o sistema pode derivar que o taxon está preparado para entrar na E19.3, sem persistir status de prontidão.

### 1.2. Identificação formal do recorte

- A E20 é o caso macro vigente para preparação e liberação de taxons.
- `E20.4` permanece reservada no planejamento conceitual para disponibilidade comercial por `taxon + plano` e não pertence a este trabalho.
- `E20.5` responde pela pesquisa integral `end_customer` selecionada e está concluída/ativa.
- O identificador seguinte livre para o segundo recorte é `E20.6`.
- A E19.2 permanece posterior e vinculada à conta e LP concretas; não participa da preparação taxonômica.
- A E19.3 permanece consumidora posterior; este plano não altera seu contrato, código, documento ou roadmap próprio.

### 1.3. Semântica da avaliação

- A pergunta obrigatória é: `o catálogo E20.2 atualmente aplicável ao taxon contém os dados factuais necessários para gerar LPs desse taxon?`.
- A avaliação possui somente dois resultados materiais:
  - suficiente, sem ajuste necessário;
  - gap factual real, com ajuste necessário na E20.2.
- Não existe estado `não avaliado, mas liberado`.
- Camada E20.2 própria do taxon não é requisito; herança suficiente deve permanecer sem camada adicional.
- Novo field exige necessidade factual e consumidor real; não nasce automaticamente de dor, objeção, copy, inferência ou conteúdo da pesquisa.
- A avaliação pode usar IA como apoio semântico, mas o MVP não cria motor, agente, workflow ou automação de suficiência.
- A pesquisa integral `end_customer` selecionada pela E20.5 e o catálogo E20.2 efetivamente analisado são as fontes principais; investigação complementar é permitida quando necessária.

### 1.4. Persistência mínima e versão executável

- A extensão mínima prevista em `business_taxons` é `reviewed_input_catalog_version integer null`.
- A coluna deve possuir check positivo quando preenchida: `reviewed_input_catalog_version IS NULL OR reviewed_input_catalog_version > 0`.
- `NULL` significa que a avaliação factual não está concluída ou foi reaberta.
- `N` significa que a versão executável `N` da E20.2 foi avaliada para aquele taxon e considerada suficiente.
- A referência é à versão do registry executável, não à versão editorial de `docs/lousa-plano-base-e20-2.md`.
- O registry vigente possui explicitamente as versões executáveis `1`, `2` e `3`.
- Não usar `Math.max`, maior chave disponível, versão mais recente, versão corrente implícita ou qualquer fallback equivalente.
- O número avaliado deve ser fornecido explicitamente pelo processo/consumidor responsável e deve corresponder à versão executável que será usada.
- Se a versão executável pretendida mudar de `N` para `M`, uma avaliação anterior de `N` não autoriza `M`; o gate falha até nova avaliação.
- Se uma LP real reabrir a suficiência de uma versão antes considerada suficiente, o marcador pode voltar a `NULL` até o ajuste e a nova decisão.

### 1.5. Estado derivado `taxon preparado`

- Não criar coluna `prepared`, status, view, tabela ou lifecycle de prontidão.
- O predicado conceitual é:
  - `business_taxons.is_active = true`;
  - seleção E20.5 válida da pesquisa integral `end_customer`;
  - `reviewed_input_catalog_version` presente e compatível com a versão executável explicitamente requerida pelo consumidor.
- O sucesso significa somente que o taxon possui conhecimento integral `end_customer` autorizado e contrato factual E20.2 revisado para entrar na E19.3.
- O sucesso não significa conta configurada, valores concretos completos, disponibilidade comercial, entitlement, LP pronta ou publicação.
- A completude de valores obrigatórios e condicionais continua sendo responsabilidade da E19.2 no contexto concreto de conta/LP.

### 1.6. Limite atual de granularidade por plano

- O marcador aprovado pela decisão humana é taxonômico e versionado, não `taxon + plano`.
- A E20.6 não cria dimensão adicional de revisão por plano.
- A avaliação deve considerar o contrato factual efetivamente presente na versão executável analisada para o taxon e não pode confundir filtro de plano com disponibilidade comercial.
- Se uma evolução futura da E20.2 introduzir diferenças factuais materiais por plano que tornem um único marcador taxonômico ambíguo ou incorreto, esse fato é critério de parada e exige novo planejamento; não ampliar preventivamente o schema agora.

### 1.7. Fontes obrigatórias usadas na v1

- `README.md`.
- `docs/roadmap.md`.
- `docs/template-roadmap.md`.
- `docs/prompt-estrategista.md`.
- `docs/lp-planejamento.md`.
- `docs/schema.md`.
- `docs/lousa-plano-base-e20-2.md`.
- `docs/lousa-plano-base-e19-2.md`, somente para preservar a fronteira da coleta de valores concretos.
- `docs/lousa-plano-base-e19-3.md`, somente para preservar a fronteira de consumo posterior, sem replanejá-la.
- `docs/lousa-plano-base-e20-5.md`, como contrato vigente da pesquisa integral selecionada e da leitura válida consumida pela E20.6.
- `lib/conversion-content/landing-page/input-catalog/registry.ts`.
- `lib/conversion-content/landing-page/input-catalog/resolver.ts`.
- `lib/admin/adapters/adminTaxonomyAdapter.ts` e `app/admin/(protected)/taxonomia/actions.ts`, como boundary administrativo existente para mutações protegidas por `platform_admin`.
- `app/admin/(protected)/taxonomia/[taxonId]/page.tsx` e `components/admin/AdminTaxonResearchSelectionForm.tsx`, como superfície e precedente visual já integrados à Taxonomia para uma decisão humana versionada.

## 2. Contrato do caso

### 2.1. Fluxo operacional da avaliação

- Gatilho:
  - taxon ativo com pesquisa integral `end_customer` selecionada e válida pela E20.5, submetido à avaliação factual de uma versão executável explícita da E20.2.
- Entrada:
  - identidade do taxon;
  - pesquisa integral E20.5 autorizada;
  - versão executável explícita `N` da E20.2;
  - catálogo E20.2 aplicável ao taxon naquela versão;
  - investigação complementar, somente se necessária.
- Processamento:
  - ler integralmente a pesquisa autorizada;
  - comparar os fatos necessários à geração com o catálogo E20.2 analisado;
  - separar conhecimento persuasivo/semântico de dado factual que precisa ser fornecido ou confirmado pelo negócio, oferta, campanha ou LP;
  - identificar gaps somente quando faltar dado factual imprescindível com consumidor real;
  - se suficiente, registrar `reviewed_input_catalog_version = N` por decisão humana autorizada;
  - se houver gap, não registrar suficiência para a versão em avaliação e encaminhar o ajuste ao recorte próprio da E20.2.
- Validação:
  - rejeitar avaliação sem E20.5 válida;
  - rejeitar versão não positiva, não explícita ou não executável;
  - rejeitar promoção automática de pesquisa para field;
  - comprovar que o resultado suficiente grava exatamente a versão avaliada.
- Persistência:
  - somente `reviewed_input_catalog_version` em `business_taxons`.
- Consumo:
  - o boundary de preparação deriva o gate final para um consumidor que informe a versão executável que pretende usar;
  - a E19.3 poderá consumir esse gate somente em trabalho próprio posterior.
- Fallback:
  - nenhum fallback para outra versão do catálogo e nenhuma presunção de suficiência herdada de avaliação anterior.

### 2.2. Barreira de admissão de gap factual

- Um gap candidato somente justifica ajuste da E20.2 quando cumulativamente:
  - representa fato necessário para gerar comunicação verdadeira daquele taxon;
  - precisa ser fornecido, confirmado ou referenciado por uma fonte operacional real;
  - possui consumidor real no fluxo da LP;
  - não é apenas dor, objeção, promessa, copy, vocabulário, narrativa, ordem, módulo ou preferência editorial;
  - não é informação já coberta por field herdado ou existente;
  - não pode ser obtido legitimamente da pesquisa integral como conhecimento contextual sem virar valor operacional.
- A ausência de camada própria do taxon não é gap por si só.
- Se os fields herdados forem suficientes, a decisão correta é `nenhum ajuste necessário`.

### 2.3. Registro humano mínimo

- A Taxonomia administrativa vigente deve ser reutilizada para registrar ou limpar `reviewed_input_catalog_version`, sem nova rota ou workflow.
- A ação deve permanecer protegida por `requirePlatformAdmin`.
- Registrar `N` representa decisão explícita de suficiência para `N` e não simples indicação de que `N` existe.
- Reabrir a avaliação permite limpar o marcador para `NULL` sem apagar histórico de versões do registry.
- Não registrar motivo, comentário, data, aprovador ou histórico no banco neste MVP.
- A evidência e a justificativa de eventual evolução da E20.2 permanecem no plano/PR próprio dessa evolução, não nesta coluna.

### 2.4. Boundary do estado derivado

- Estender o boundary `lib/conversion-content/landing-page/taxon-preparation/` iniciado pela E20.5, sem criar segundo domínio de prontidão.
- A API pública mínima deve receber explicitamente a versão executável requerida pelo consumidor; ela não escolhe versão.
- O resultado de preparação deve distinguir no mínimo:
  - taxon inativo;
  - pesquisa integral não selecionada ou inválida;
  - avaliação E20.2 ausente;
  - versão avaliada incompatível com a versão requerida;
  - preparado.
- Esses estados são resultados tipados de leitura, não valores persistidos.
- O boundary não avalia semanticamente suficiência em runtime; ele apenas aplica deterministicamente a decisão já registrada.
- A verificação de executabilidade da E20.2 deve reutilizar contratos públicos vigentes ou ser feita no contexto que já dispõe dos inputs necessários ao resolver; não expor o registry interno nem criar lookup paralelo somente para descobrir `latest`.

### 2.5. Aprendizado posterior

- Se uma LP real demonstrar falta factual não prevista:
  - reabrir a avaliação do taxon;
  - limpar ou invalidar operacionalmente a suficiência anterior enquanto o gap permanecer real;
  - evoluir a E20.2 somente se a barreira da seção 2.2 for atendida;
  - criar nova versão executável quando a mudança funcional do catálogo exigir;
  - reavaliar o taxon contra a versão que será usada.
- Esse ciclo é aprendizado normal do MVP e não autoriza antecipar fields hipotéticos.

## 3. Fases e próxima ação

### 3.1. E20.6.3 — Persistência e registro humano da suficiência

- Status: planejada.
- Objetivo: adicionar o marcador mínimo de versão E20.2 avaliada e permitir sua gravação ou limpeza por decisão humana administrativa explícita.
- Automação: não.
- Escopo executável:
  - criar migration mínima para `reviewed_input_catalog_version integer null` com check positivo quando presente;
  - preservar `business_taxons` como única entidade;
  - reutilizar a superfície administrativa vigente de Taxonomia e `requirePlatformAdmin`;
  - aceitar somente versão inteira positiva explicitamente informada;
  - impedir gravação de suficiência quando a E20.5 estiver inválida;
  - permitir retorno a `NULL` quando a avaliação for reaberta.
- Critérios visuais e evidência esperada:
  - reutilizar a página `/admin/taxonomia/[taxonId]`, sem nova rota, com bloco próprio que diferencie claramente `não avaliado` de `versão N avaliada`;
  - manter ação explícita para registrar `N` e para reabrir a avaliação retornando a `NULL`, com rótulos, feedback e estado pendente compreensíveis sem depender apenas de cor;
  - comprovar em Preview autenticado, desktop e mobile, o estado `NULL`, a gravação explícita de `N`, a persistência após reload, a reabertura para `NULL` e o bloqueio de papel não autorizado.
- Critérios de aceite:
  - `0` e negativos rejeitados;
  - `NULL` permanece válido e bloqueante;
  - nenhuma versão é inferida automaticamente;
  - nenhum status, tabela ou histórico adicional;
  - nenhuma alteração preventiva no registry E20.2.

### 3.2. E20.6.4 — Gate derivado de preparação do taxon

- Status: planejada.
- Objetivo: derivar deterministicamente se o taxon pode entrar na E19.3 para uma versão executável explicitamente requerida.
- Automação: não.
- Escopo executável:
  - estender o boundary `taxon-preparation` da E20.5;
  - exigir taxon ativo;
  - reutilizar a validação integral da pesquisa selecionada;
  - exigir `reviewed_input_catalog_version` presente;
  - comparar igualdade exata entre versão avaliada e versão executável requerida;
  - retornar falhas tipadas sem persistir readiness;
  - adicionar casos determinísticos para ausência, incompatibilidade e sucesso.
- Critérios de aceite:
  - `is_active = true + E20.5 válida + reviewed_input_catalog_version = versão requerida` produz sucesso derivado;
  - qualquer parcela ausente ou incompatível falha fechado;
  - mudança da versão requerida invalida o sucesso anterior até nova avaliação;
  - nenhuma leitura da maior versão do registry;
  - E19.2, E19.3 e E19.4 permanecem inalteradas.
- Validação final do recorte:
  - usar uma pesquisa integral `end_customer` efetivamente selecionada pela E20.5 e uma versão executável E20.2 explicitamente escolhida sobre um taxon real;
  - se a avaliação humana concluir suficiência, comprovar a gravação da versão avaliada e o predicado derivado após reload;
  - se identificar gap factual real, não gravar suficiência, interromper o recorte para aquele taxon e encaminhar a evolução ao plano próprio da E20.2;
  - nenhuma camada específica nasce sem gap real, nenhuma pesquisa é promovida automaticamente a field e a evidência deve deixar rastreável qual versão executável foi analisada sem criar histórico no banco;
  - o recorte só encerra com uma prova real do predicado derivado ou com um bloqueio factual corretamente encaminhado à E20.2.

## 4. Escopo negativo e critérios de parada

### 4.1. Escopo negativo

- Não replanejar ou alterar E19.3 ou E19.4.
- Não modificar E19.2 nem misturar preparação do taxon com completude de conta/LP.
- Não criar pesquisa `business_buyer`.
- Não tornar camada E20.2 própria obrigatória por taxon.
- Não criar field E20.2 preventivamente.
- Não criar motor semântico de suficiência, agente, workflow, job ou automação.
- Não criar tabela, coluna `prepared`, status, view ou lifecycle de prontidão.
- Não criar histórico, data, aprovador ou justificativa persistida da avaliação.
- Não usar maior versão disponível, latest ou fallback de registry.
- Não definir disponibilidade comercial, entitlement, contratação, publicação ou capacidade por plano.
- Não criar dimensão `taxon + plano` para o marcador sem novo gap real e novo planejamento.

### 4.2. Critérios de parada

- Parar se a avaliação demonstrar gap factual real; a correção pertence ao recorte próprio da E20.2 e a E20.6 somente recomeça após a evolução aplicável.
- Parar se a versão executável não puder ser identificada explicitamente sem inventar regra de `latest`.
- Parar se diferenças factuais futuras entre planos tornarem `reviewed_input_catalog_version` taxonômico insuficiente; devolver a modelagem ao Estrategista antes de ampliar schema.
- Parar se o gate derivado exigir nova entidade, workflow ou infraestrutura.
- Encerrar o recorte quando o sistema conseguir provar, sem estado adicional, `taxon ativo + pesquisa integral end_customer selecionada/válida + versão E20.2 avaliada/compatível = taxon preparado para E19.3`.