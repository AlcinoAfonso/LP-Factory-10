# Plano-base — E20.3 — Composição estrutural mínima

- Data: 25/07/2026.
- Versão: v1 substitutiva após o PR #635.
- Status: plano-base v1 para avaliação única do Analista.
- Recorte previsto para o roadmap: `20.3 — Composição estrutural mínima de landing_page`.
- Path canônico: `docs/lousa-plano-base-e20-3.md`.
- Plano conceitual: `docs/lp-planejamento.md`.

## 1. Estado e decisões fixas

### 1.1. Problema e resultado esperado

- O projeto já possui:
  - pesquisas estruturadas resolvidas pela E10.8;
  - parametrização raiz versionada da E18.4;
  - catálogo executável de módulos e variantes da E18.5;
  - catálogo declarativo de entradas da E20.2.
- Ainda não existe a composição estrutural canônica que determine, por taxon proprietário e versão:
  - módulos;
  - variantes;
  - ordem;
  - obrigatoriedade quando aplicável.
- O resultado esperado da E20.3 é:
  - representar e persistir minimamente essa composição;
  - preservar estados e versões;
  - validar as identidades contra a E18.5;
  - resolver composição própria ou herdada.
- A E20.3 não cria composição oficial nesta etapa.
- A futura E12.4 operará proposta, revisão, aprovação e ativação da primeira composição oficial.

### 1.2. Fontes usadas

- `README.md`.
- `docs/prompt-estrategista.md`.
- `docs/template-roadmap.md`.
- `docs/roadmap.md`.
- `docs/lp-planejamento.md`, após o merge do PR #635.
- `docs/base-tecnica.md`.
- `docs/schema.md`.
- `docs/lousa-plano-base-e18-5.md`.
- `docs/lousa-plano-base-e20-2.md`.
- Implementação vigente em:
  - `lib/conversion-content/landing-page/module-catalog/`;
  - `lib/conversion-content/landing-page/input-catalog/`;
  - `lib/conversion-content/index.ts`.
- Estado pós-reconciliação do PR #636:
  - as migrations antecipadas permanecem no histórico;
  - os objetos abandonados foram removidos;
  - nenhuma estrutura da implementação superdimensionada permanece vigente.

### 1.3. Decisões funcionais fixas

- Existe uma composição canônica por `taxon proprietário + versão`.
- A composição é reutilizada entre planos.
- Cada item da composição referencia:
  - módulo e versão;
  - variante e versão;
  - posição ordenada;
  - obrigatoriedade quando aplicável.
- Somente identidades oficialmente registradas na E18.5 são válidas.
- O lifecycle mínimo distingue:
  - `draft`;
  - `active`;
  - `archived`.
- Uma versão `active` não é editada diretamente.
- Uma mudança aprovada cria nova versão e preserva as anteriores.
- No máximo uma versão pode estar `active` por taxon proprietário.
- Na ausência de composição própria ativa, a resolução usa o ancestral elegível mais próximo, salvo bloqueio explícito de herança.
- Não existe composição universal implícita.
- A composição própria de ultranicho permanece excepcional e depende de permissão explícita no contrato mínimo de política do taxon.
- Automação: não.

### 1.4. Fronteiras de responsabilidade

- A E18.5 define módulos e variantes; a E20.3 apenas referencia e valida suas identidades versionadas.
- A E20.2 permanece responsável pelo catálogo de entradas e não integra o payload da composição.
- A E20.3 fornece:
  - contrato estrutural;
  - persistência mínima;
  - lifecycle e versões;
  - validação;
  - resolução própria ou herdada.
- A futura E12.4 operará:
  - proposta;
  - revisão;
  - aprovação;
  - ativação;
  - primeiro cadastro oficial.
- Planos posteriores tratarão:
  - IA;
  - gaps persistidos;
  - prontidão;
  - autorização;
  - revogação;
  - geração e publicação de LP.

## 2. Contrato do caso

### 2.1. Fluxo operacional

- Gatilho:
  - consumidor server-side solicita a composição aplicável a um taxon;
  - casos executáveis validam criação, lifecycle e resolução com dados de teste.
- Entrada:
  - taxon atendido e cadeia taxonômica normalizada;
  - política mínima do taxon;
  - composições persistidas;
  - catálogo oficial da E18.5.
- Processamento:
  - localizar composição própria ativa;
  - na ausência, verificar bloqueio de herança;
  - localizar o ancestral elegível mais próximo;
  - validar estrutura, estado, versão e identidades;
  - devolver resultado tipado e determinístico.
- Validação:
  - taxon proprietário e cadeia válidos;
  - versão inteira positiva;
  - lifecycle válido;
  - ordem inteira, única e contínua;
  - módulo e variante existentes e compatíveis na E18.5;
  - política de herança respeitada.
- Persistência:
  - política mínima necessária à herança e à excepcionalidade do ultranicho;
  - composição versionada e seus itens estruturais.
- Consumo:
  - boundary server-side da própria E20.3;
  - futura E12.4;
  - futuros consumidores somente após seus planos próprios.
- Fallback:
  - composição própria ativa;
  - composição ativa do ancestral elegível mais próximo;
  - ausência tipada;
  - falha fechada diante de estrutura ou identidade inválida.

### 2.2. Contrato mínimo da composição

- Identidade:
  - ID;
  - taxon proprietário;
  - versão;
  - status.
- Itens ordenados:
  - ID e versão do módulo;
  - ID e versão da variante;
  - posição;
  - obrigatoriedade quando aplicável.
- Metadados mínimos:
  - criação;
  - última atualização;
  - ativação quando aplicável.
- A composição não armazena:
  - copy;
  - pesquisas;
  - parâmetros da E18.4;
  - catálogo ou valores da E20.2;
  - gaps;
  - prontidão;
  - autorização;
  - revogação;
  - dados da conta;
  - LP gerada.

### 2.3. Persistência mínima

- Criar somente as estruturas necessárias para:
  - política de herança e permissão excepcional de composição própria;
  - composição versionada com payload estrutural validado.
- Usar uma representação compacta para os itens ordenados, sem normalizar prematuramente cada item em tabela própria.
- Proteger no banco:
  - referências ao taxon;
  - versão positiva e única por taxon proprietário;
  - status fechado;
  - no máximo uma versão ativa por taxon proprietário;
  - payload estrutural presente;
  - imutabilidade da versão ativa.
- Proteger no runtime:
  - validação estrita do payload;
  - compatibilidade módulo-variante;
  - existência das versões na E18.5;
  - transições de lifecycle permitidas.
- Implementar adapter server-side no boundary da E20.3.
- Não criar rota, API, Server Action ou UI.
- Migration:
  - incremental e forward-only;
  - criada e revisada no PR da implementação;
  - aplicada remotamente somente após merge na `main`;
  - acompanhada da atualização de `docs/schema.md`.
- A migration deve terminar sem registros oficiais:
  - sem seed;
  - sem insert de composição;
  - sem composição ativa criada automaticamente.

### 2.4. Lifecycle e versionamento

- `draft`:
  - pode ser validado e substituído antes da ativação;
  - não participa da resolução.
- `active`:
  - é imutável;
  - participa da resolução;
  - existe no máximo uma por taxon proprietário.
- `archived`:
  - preserva a versão histórica;
  - não participa da resolução;
  - não retorna a `draft` nem a `active`.
- A ativação de nova versão:
  - revalida o payload no servidor;
  - arquiva atomicamente a versão ativa anterior;
  - ativa a nova versão.
- Nesta etapa, as operações existem apenas como contrato e boundary interno para testes e futuro consumo da E12.4.

### 2.5. Validação contra a E18.5

- Cada item deve referenciar:
  - módulo existente na versão informada;
  - variante existente na versão informada;
  - variante vinculada ao módulo informado.
- A ordem deve ser:
  - inteira;
  - única;
  - contínua;
  - determinística.
- Não impor nesta etapa:
  - módulo único por composição;
  - formulário único;
  - limite nominal por módulo ou variante;
  - escolhas livres não previstas pelo contrato estrutural.
- Identidade desconhecida ou incompatível falha fechado.
- A validação não altera o catálogo E18.5 nem cria identidades.

### 2.6. Herança e resolução

- Precedência:
  - composição própria `active`;
  - composição `active` do ancestral elegível mais próximo;
  - ausência de composição.
- Para ultranicho sem composição própria ativa:
  - nicho direto;
  - depois segmento.
- Para nicho sem composição própria ativa:
  - segmento direto.
- O bloqueio explícito no taxon atendido impede herança.
- Uma composição inválida não é corrigida, ignorada ou substituída silenciosamente.
- O resultado preserva:
  - taxon atendido;
  - taxon proprietário;
  - ID e versão da composição;
  - relação `own` ou `inherited`;
  - itens ordenados;
  - validade ou código fechado de falha.

### 2.7. Casos executáveis mínimos

- Contrato:
  - composição válida;
  - status inválido;
  - versão inválida;
  - ordem duplicada ou descontínua;
  - módulo desconhecido;
  - variante desconhecida ou incompatível.
- Lifecycle:
  - criação de `draft`;
  - ativação sem versão anterior;
  - ativação com arquivamento da anterior;
  - tentativa de editar versão ativa;
  - tentativa de manter duas versões ativas.
- Resolução:
  - composição própria;
  - herança de nicho;
  - herança de segmento;
  - herança bloqueada;
  - ausência de composição;
  - composição encontrada, porém inválida.
- Os casos usam fixtures e não criam composição oficial.

## 3. Fases e próxima ação

### 3.1. E20.3.3 — Contrato e persistência mínima da composição

- Automação: não.
- Objetivo:
  - implementar o contrato estrutural, lifecycle, versionamento e persistência mínima da composição.
- Entregas:
  - criar o boundary canônico em `lib/conversion-content/landing-page/composition/`;
  - criar contratos TypeScript e schemas Zod estritos;
  - criar a migration mínima da seção 2.3;
  - implementar adapter server-side;
  - implementar operações internas de `draft`, validação e ativação;
  - atualizar `docs/schema.md`;
  - adicionar casos executáveis de contrato e lifecycle.
- Critérios de aceite:
  - somente as duas responsabilidades persistentes da seção 2.3;
  - uma única versão ativa por taxon proprietário;
  - versão ativa imutável;
  - payload inválido não ativa;
  - migration sem seed ou registro oficial;
  - nenhuma rota, API, Server Action ou UI;
  - `npm run check` e `git diff --check` aprovados;
  - apply remoto somente após merge na `main`.

### 3.2. E20.3.4 — Validação E18.5 e resolução própria ou herdada

- Automação: não.
- Objetivo:
  - validar a composição contra o catálogo vigente e resolver a versão aplicável de forma determinística e fail-closed.
- Entregas:
  - implementar resolver puro;
  - integrar leitura pelo adapter server-side;
  - validar módulo, variante, versões, vínculo e ordem contra a E18.5;
  - implementar precedência própria e ancestral elegível mais próximo;
  - implementar bloqueio explícito de herança;
  - preservar proveniência mínima no resultado tipado;
  - exportar API pública mínima pelo namespace vigente;
  - adicionar casos executáveis de validação e resolução.
- Critérios de aceite:
  - casos próprios, herdados, bloqueados, ausentes e inválidos cobertos;
  - nenhuma composição universal implícita;
  - nenhuma identidade criada ou corrigida silenciosamente;
  - nenhuma dependência de E10.8, E18.4 ou E20.2 para resolver a estrutura;
  - nenhuma prontidão, autorização ou revogação;
  - `npm run check` e `git diff --check` aprovados.

### 3.3. Próxima ação

- Submeter esta v1 à avaliação única do Analista.
- Após o parecer:
  - consolidar a v2 no mesmo PR;
  - orientar o Executor a atualizar `docs/roadmap.md` no PR da implementação com:
    - `20.3`;
    - `20.3.1`;
    - `20.3.3`;
    - `20.3.4`;
  - omitir `20.3.2` enquanto não houver registro material.
- Não iniciar implementação antes da aprovação, consolidação e merge humano do plano-base.
- Debater a E12.4 somente após a conclusão da E20.3.

## 4. Escopo negativo e critérios de parada

### 4.1. Escopo negativo

- E12.4.
- Admin Dashboard.
- Integração com IA.
- Proposta, revisão ou aprovação por usuário.
- Gap persistido ou governança de gaps.
- Prontidão.
- Autorização ou revogação por conta, taxon ou plano.
- Copy, geração, renderização, preview, publicação ou tracking de LP.
- E19.4, E20.4 e E12.4.3–E12.4.6.
- Snapshot das pesquisas E10.8, da raiz E18.4 ou das entradas E20.2.
- Dados operacionais de conta, oferta, campanha ou LP.
- Normalização de cada item da composição em tabela própria.
- Tabela de avaliações, autorizações, gaps ou histórico operacional separado.
- Rota, API, Server Action ou UI.
- Editor visual, canvas ou drag-and-drop.
- Agente, automação, job, fila, cron, webhook, cache ou serviço separado.
- Nova infraestrutura.
- Composição oficial criada por migration, seed, fixture, script ou insert direto.
- Reaproveitamento automático do código ou dos objetos abandonados no PR #631.

### 4.2. Critérios de parada imediata

- Parar e devolver ao Estrategista se:
  - a implementação exigir prontidão, autorização, revogação, gaps persistidos ou Admin;
  - a E18.5 não oferecer contrato público suficiente para validar módulo e variante;
  - a política de ultranicho ou herança exigir decisão funcional adicional;
  - a persistência mínima exigir responsabilidade além das duas previstas na seção 2.3;
  - surgir necessidade de nova rota, UI, serviço, automação ou infraestrutura;
  - qualquer migration precisar ser aplicada remotamente antes do merge;
  - o estado real do repositório divergir das fontes deste plano.

### 4.3. Validação deste trabalho documental

- Confirmar que o diff contém somente `docs/lousa-plano-base-e20-3.md`.
- Confirmar as quatro seções obrigatórias.
- Confirmar duas fases executáveis:
  - E20.3.3;
  - E20.3.4.
- Confirmar `Automação: não` nas duas fases.
- Confirmar que E12.4, IA, gaps persistidos, prontidão, autorização e revogação permanecem fora.
- Confirmar ausência de composição oficial nesta etapa.
- Executar `git diff --check`.
- Registrar como N/A nesta v1 documental:
  - `npm ci`;
  - `npm run check`;
  - validações materiais;
  - teste humano;
  - smoke visual.

### 4.4. Critérios de encerramento do plano

- O plano encerra após:
  - implementação das duas fases na ordem aprovada;
  - avaliação do Analista após cada entrega material;
  - merge humano da implementação;
  - confirmação do estado final do banco;
  - relatório final ao Gestor de Docs.
- A conclusão da E20.3 libera o debate conceitual da E12.4, mas não autoriza sua implementação automática.
