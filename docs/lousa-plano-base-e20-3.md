# Plano-base — E20.3 — Perfil de orientação para geração

- Data: 26/07/2026.
- Versão: v1.
- Status: plano-base v1 para avaliação única do Analista.
- Recorte previsto para o roadmap: `20.3 — Perfil de orientação para geração de landing_page`.
- Path canônico: `docs/lousa-plano-base-e20-3.md`.
- Plano conceitual: `docs/lp-planejamento.md`, após o merge do PR #642.

## 1. Estado e decisões fixas

### 1.1. Problema e resultado esperado

- O projeto já possui:
  - pesquisas estruturadas resolvidas pela E10.8;
  - parametrização raiz versionada da E18.4;
  - catálogo executável de módulos e variantes da E18.5;
  - catálogo declarativo de entradas da E20.2.
- Ainda não existe o perfil canônico que oriente a geração inicial de `landing_page` para um taxon.
- A E20.3 deve:
  - representar e persistir minimamente um perfil versionado por taxon proprietário;
  - reunir orientação geral e recomendações por módulo;
  - validar referências de módulo e variante contra a E18.5;
  - resolver perfil próprio ou herdado;
  - entregar o perfil por um único boundary server-side.
- O perfil orienta escolhas futuras. Ele não define uma composição obrigatória, não fixa a LP final e não gera conteúdo.
- A E20.3 atual não cadastra nem ativa perfil oficial.
- O primeiro cadastro e a primeira ativação serão operados pela futura E12.4.

### 1.2. Fontes usadas

- `README.md`.
- `docs/prompt-estrategista.md`.
- `docs/template-roadmap.md`.
- `docs/roadmap.md`.
- `docs/lp-planejamento.md`, após o merge do PR #642.
- `docs/base-tecnica.md`.
- `docs/schema.md`.
- `docs/lousa-plano-base-e18-5.md`.
- `docs/lousa-plano-base-e20-2.md`.
- Implementação vigente:
  - `lib/conversion-content/landing-page/module-catalog/`;
  - `lib/conversion-content/landing-page/input-catalog/`;
  - `lib/conversion-content/index.ts`.
- Estado pós-reconciliação do PR #636:
  - migrations antecipadas preservadas no histórico;
  - objetos abandonados removidos;
  - nenhuma estrutura superdimensionada vigente.

### 1.3. Decisões funcionais fixas

- Existe um perfil versionado por `taxon proprietário + versão`, reutilizado entre planos.
- O perfil pode pertencer a segmento ou nicho; perfil próprio de ultranicho é excepcional e depende de decisão humana explícita no fluxo futuro responsável.
- O perfil reúne:
  - orientação geral em `generation_guidance`;
  - recomendações próprias por módulo;
  - variante preferencial, quando aplicável;
  - prioridade;
  - ordem recomendada;
  - `item_guidance`, quando aplicável.
- A prioridade usa enum fechado `P1`, `P2` e `P3`, em ordem decrescente de importância.
- Prioridade orientará a seleção futura; ordem recomendada indicará a posição relativa entre os módulos selecionados.
- Nenhuma recomendação torna módulo obrigatório ou redefine a E18.4 ou a E18.5.
- Somente identidades oficialmente registradas na E18.5 são válidas.
- Estados do perfil: `draft`, `active` e `archived`.
- Uma versão `active` não é editada diretamente; mudança aprovada cria nova versão e preserva as anteriores.
- Existe no máximo uma versão `active` por taxon proprietário.
- Sem perfil próprio ativo, a resolução usa o ancestral elegível mais próximo.
- Não existe perfil universal implícito.
- A LP futuramente materializada é independente e não muda com novas versões do perfil.
- Automação: não.

### 1.4. Fronteiras de responsabilidade

- E18.4 define a parametrização raiz.
- E18.5 define módulos, variantes e contratos; E20.3 apenas referencia e valida suas identidades versionadas.
- E20.2 define entradas; seus valores não integram o perfil.
- E20.3 fornece contrato, persistência mínima, estados, versões, validação, leitura e resolução.
- A futura E12.4 opera proposta por IA, revisão humana, primeiro cadastro, aprovação e ativação.
- Planos posteriores tratam seleção efetiva por prioridade, geração, gaps persistidos, prontidão, autorização, revogação, aprendizado, publicação e evolução da LP.

## 2. Contrato do caso

### 2.1. Fluxo operacional

- Gatilho:
  - consumidor server-side solicita o perfil aplicável a um taxon;
  - casos executáveis validam contrato e resolução com fixtures.
- Entrada:
  - taxon atendido e cadeia taxonômica normalizada;
  - perfis persistidos;
  - catálogo oficial da E18.5.
- Processamento:
  - localizar perfil próprio `active` ou, na ausência, o ancestral elegível mais próximo;
  - validar versão, estado, orientação e recomendações;
  - validar identidades contra a E18.5;
  - devolver resultado tipado e com proveniência.
- Persistência:
  - exatamente duas tabelas de domínio: perfil versionado e itens recomendados;
  - os itens pertencem à versão do perfil e não possuem versão ou lifecycle próprios.
- Fallback:
  - perfil próprio;
  - perfil herdado;
  - ausência tipada;
  - falha fechada para perfil ou referência inválida.

### 2.2. Contrato mínimo do perfil

- Identidade:
  - ID;
  - taxon proprietário;
  - versão inteira positiva;
  - estado.
- Orientação geral:
  - texto não vazio.
- Cada item recomendado contém:
  - módulo e versão;
  - variante preferencial e versão, quando aplicável;
  - prioridade `P1`, `P2` ou `P3`;
  - ordem recomendada inteira positiva;
  - `item_guidance`, quando aplicável.
- Regras:
  - `P1` representa maior prioridade, seguida por `P2` e `P3`;
  - não são aceitos `P4`, `P5` ou valores numéricos arbitrários;
  - ordem recomendada é única entre os itens do perfil, mas não precisa ser contínua;
  - existe no máximo um item por módulo no perfil;
  - `item_guidance` pode reunir a orientação específica e sua razão;
  - não existe campo de obrigatoriedade.
- Perfil e itens formam um único agregado de domínio entregue aos consumidores.
- O perfil não armazena:
  - composição final;
  - copy;
  - pesquisas;
  - parâmetros da E18.4;
  - catálogo ou valores da E20.2;
  - gaps, prontidão, autorização ou revogação;
  - dados da conta;
  - LP ou snapshot.

### 2.3. Persistência mínima

- Criar exatamente duas tabelas de domínio:
  - `landing_page_generation_profiles`:
    - ID;
    - taxon proprietário;
    - versão;
    - status;
    - `generation_guidance`;
    - metadados mínimos;
  - `landing_page_generation_profile_items`:
    - ID;
    - `profile_id`;
    - módulo e versão;
    - variante preferencial e versão, quando houver;
    - prioridade;
    - ordem recomendada;
    - `item_guidance`, quando houver.
- A tabela de itens possui FK para `landing_page_generation_profiles`.
- Os itens pertencem à versão do perfil e não possuem versão, status ou lifecycle próprios.
- Proteger no banco:
  - FK do perfil para o taxon proprietário;
  - FK de cada item para o perfil;
  - versão positiva e única por taxon proprietário;
  - status fechado;
  - uma única versão `active` por taxon proprietário;
  - `generation_guidance` presente;
  - prioridade fechada em `P1`, `P2` e `P3`;
  - integridade entre perfil e itens;
  - RLS habilitado nas duas tabelas e ausência de acesso direto por `anon` e `authenticated`.
- Proteger no runtime:
  - contratos próprios do perfil e dos itens;
  - schema estrito do agregado;
  - regras de prioridade e ordem;
  - ausência de obrigatoriedade;
  - existência e compatibilidade de módulo e variante na E18.5;
  - imutabilidade do resultado entregue.
- Implementar adapter server-side que leia as duas tabelas.
- Expor um único boundary que entregue perfil e itens juntos.
- Consumidores não consultam as duas tabelas separadamente.
- Implementar somente leitura server-side.
- Não criar operação de escrita, RPC, trigger de lifecycle, rota, API, Server Action, UI ou tabela de política do taxon.
- A migration deve:
  - criar exatamente as duas tabelas;
  - ser incremental e forward-only;
  - ser aplicada remotamente somente após merge na `main`;
  - atualizar `docs/schema.md`;
  - terminar sem seed, insert ou perfil oficial.

### 2.4. Estados e versionamento

- `draft`:
  - versão ainda não aprovada;
  - não participa da resolução.
- `active`:
  - versão aprovada;
  - participa da resolução;
  - não é editada diretamente.
- `archived`:
  - versão histórica;
  - não participa da resolução.
- Nesta etapa:
  - estados e invariantes pertencem ao contrato da E20.3;
  - transições não são implementadas;
  - fixtures podem representar os três estados sem criar perfil oficial.
- A futura E12.4 implementará as mutações e a atomicidade necessárias sem alterar o significado dos estados.

### 2.5. Validação contra a E18.5

- Módulo deve existir na versão informada.
- Variante preferencial, quando presente, deve existir na versão informada e pertencer ao módulo.
- A recomendação não pode redefinir fields, capabilities ou interactions.
- Prioridade não significa obrigação; ordem recomendada não significa composição fixa.
- Identidade desconhecida ou incompatível falha fechado.
- A validação não altera a E18.5 nem cria identidades.

### 2.6. Herança e resolução

- Precedência:
  - perfil próprio `active`;
  - perfil `active` do ancestral elegível mais próximo;
  - ausência de perfil.
- Ultranicho sem perfil próprio ativo consulta nicho direto e depois segmento.
- Nicho sem perfil próprio ativo consulta segmento direto.
- A excepcionalidade de perfil próprio de ultranicho será controlada pelo fluxo futuro de cadastro, sem política persistente paralela nesta etapa.
- Perfil inválido não é corrigido, ignorado ou substituído silenciosamente.
- Resultado preserva taxon atendido, taxon proprietário, ID, versão, relação `own` ou `inherited`, orientação e recomendações.

### 2.7. Casos executáveis mínimos

- Contrato:
  - perfil válido;
  - estado ou versão inválidos;
  - `generation_guidance` inválida;
  - prioridade fora de `P1`, `P2` e `P3`;
  - ordem recomendada inválida;
  - item duplicado;
  - `item_guidance` inválida, quando presente;
  - tentativa de declarar obrigatoriedade;
  - módulo ou variante inválidos.
- Integridade:
  - item vinculado ao perfil por FK;
  - item sem perfil rejeitado;
  - item sem versão ou lifecycle próprio;
  - agregado entregue sempre com perfil e itens juntos.
- Estados:
  - somente `active` participa da resolução;
  - unicidade da versão ativa protegida pela persistência.
- Resolução:
  - perfil próprio;
  - herança de nicho;
  - herança de segmento;
  - ausência;
  - perfil inválido.
- Casos usam fixtures e não cadastram nem ativam perfil oficial.

## 3. Fases e próxima ação

### 3.1. E20.3.3 — Contrato e persistência mínima do perfil

- Automação: não.
- Objetivo:
  - implementar o agregado versionado e a persistência mínima do perfil de orientação.
- Entregas:
  - criar boundary em `lib/conversion-content/landing-page/generation-profile/`;
  - criar contratos TypeScript próprios do perfil e dos itens;
  - criar schema Zod estrito do agregado;
  - criar migration com `landing_page_generation_profiles` e `landing_page_generation_profile_items`;
  - implementar adapter server-side que leia as duas tabelas;
  - expor boundary único que entregue perfil e itens juntos;
  - atualizar `docs/schema.md`;
  - adicionar casos de contrato, estados e integridade entre perfil e itens.
- Critérios de aceite:
  - exatamente duas tabelas de domínio;
  - FK dos itens para o perfil;
  - itens sem versão ou lifecycle próprios;
  - prioridade limitada a `P1`, `P2` e `P3`;
  - um único `item_guidance` textual por item;
  - uma única versão `active` por taxon proprietário;
  - consumidores sem consulta separada às tabelas;
  - nenhum módulo obrigatório ou composição final;
  - nenhuma mutação, RPC, trigger, rota, API, Server Action ou UI;
  - nenhum registro oficial;
  - `npm run check` e `git diff --check` aprovados;
  - apply remoto somente após merge na `main`.

### 3.2. E20.3.4 — Validação E18.5 e resolução própria ou herdada

- Automação: não.
- Objetivo:
  - validar recomendações e resolver o perfil aplicável de forma determinística e fail-closed.
- Entregas:
  - implementar resolver puro e integrar a leitura server-side;
  - validar módulo, variante, versões e vínculo contra a E18.5;
  - preservar prioridade e ordem como orientação;
  - implementar precedência própria e ancestral;
  - preservar proveniência;
  - exportar API pública mínima;
  - adicionar casos de validação e resolução.
- Critérios de aceite:
  - casos próprios, herdados, ausentes e inválidos cobertos;
  - nenhum perfil universal implícito;
  - nenhuma identidade criada ou corrigida;
  - nenhuma seleção por plano ou prioridade;
  - nenhuma prontidão, autorização, revogação ou geração;
  - `npm run check` e `git diff --check` aprovados.

### 3.3. Próxima ação

- Submeter esta v1 à avaliação única do Analista.
- Se necessário, ajustar a própria v1 no mesmo PR.
- Após aprovação e merge humano, orientar o Executor a:
  - implementar E20.3.3 e E20.3.4 na ordem;
  - atualizar `docs/roadmap.md` no PR material;
  - não iniciar E12.4.
- Debater a E12.4 somente após a conclusão da E20.3.

## 4. Escopo negativo e critérios de parada

### 4.1. Escopo negativo

- Composição obrigatória, estrutura final ou módulo obrigatório.
- Seleção efetiva por prioridade ou diferenciação por plano.
- E12.4, Admin Dashboard, IA e aprendizado automático.
- Cadastro, edição, aprovação, ativação ou arquivamento de perfil.
- Gaps persistidos, prontidão, autorização ou revogação.
- Copy, geração, renderização, preview, publicação, tracking ou snapshot.
- E19.4, E20.4 e E12.4.3–E12.4.6.
- Dados operacionais de conta, oferta, campanha ou LP.
- Terceira tabela de domínio.
- Tabelas de políticas, gaps, avaliações, aprendizado ou autorização.
- RPC, trigger de lifecycle, rota, API, Server Action ou UI.
- Editor visual, agente, automação, job, fila, cron, webhook, cache, serviço ou nova infraestrutura.
- Perfil oficial criado por migration, seed, fixture, script ou insert direto.
- Reaproveitamento automático dos objetos abandonados no PR #631.

### 4.2. Critérios de parada imediata

- Parar e devolver ao Estrategista se:
  - surgir composição obrigatória, seleção efetiva, geração ou diferença por plano;
  - for exigida qualquer mutação do perfil;
  - a E18.5 não oferecer contrato público suficiente;
  - surgir caso real de perfil próprio de ultranicho antes da definição de sua autorização;
  - surgir necessidade de uma terceira tabela de domínio nesta etapa;
  - surgir rota, UI, serviço, automação ou infraestrutura;
  - uma migration precisar ser aplicada antes do merge;
  - o repositório divergir das fontes do plano.

### 4.3. Validação deste trabalho documental

- Confirmar:
  - somente `docs/lousa-plano-base-e20-3.md` alterado;
  - quatro seções preservadas;
  - duas fases com `Automação: não`;
  - documento mantido como v1;
  - exatamente duas tabelas de domínio;
  - prioridade fechada em `P1`, `P2` e `P3`;
  - um único `item_guidance` por item;
  - boundary único para perfil e itens;
  - ausência de composição obrigatória, cadastro oficial, E12.4, IA, gaps, prontidão, autorização, revogação e geração.
- Executar `git diff --check`.
- Registrar como N/A:
  - `npm ci`;
  - `npm run check`;
  - validação material;
  - teste humano;
  - smoke visual.

### 4.4. Critérios de encerramento do plano

- O plano encerra após:
  - implementação das duas fases na ordem;
  - avaliação do Analista após cada entrega;
  - merge humano;
  - confirmação do estado final do banco;
  - relatório final ao Gestor de Docs.
- A conclusão da E20.3 libera o debate da E12.4, mas não autoriza sua implementação.
