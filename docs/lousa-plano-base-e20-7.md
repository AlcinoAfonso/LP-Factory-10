# 26/08/2026 — Rascunho vivo — E20.7 — Liberação taxonômica para geração de Landing Pages

## 1. Estado

### 1.1. Natureza do documento

- Status: rascunho vivo em debate humano; ainda não constitui plano-base v1 nem autorização de implementação.
- Caso macro: `E20 — Preparação e liberação de taxons para geração de landing pages`.
- Recorte proposto: `E20.7 — Liberação taxonômica para geração de Landing Pages`.
- Objetivo deste rascunho: registrar progressivamente as decisões humanas sobre qual taxon pode servir Landing Pages e qual sequência torna esse taxon preparado, sem antecipar implementação.

### 1.2. Fontes usadas

- `README.md` — visão do produto, simplicidade do MVP e comunicação comercial por nicho.
- `docs/roadmap.md` — estado e fronteiras de E20, E19 e E9.
- `docs/lousa-plano-base-e20-2.md` — catálogo declarativo e herança `universal → segmento → nicho → ultranicho`.
- `docs/lousa-plano-base-e20-5.md` — seleção da pesquisa integral `end_customer` por taxon.
- `docs/lousa-plano-base-e20-6.md` — suficiência factual e predicado derivado de taxon preparado.
- `docs/lousa-plano-base-e19-3.md` — consumo posterior de taxon preparado e cadeia taxonômica completa.
- `docs/schema.md` — estrutura vigente de `business_taxons` e `account_taxonomy`.
- `lib/conversion-content/landing-page/input-catalog/taxon-chain.ts` — validação executável da cadeia taxonômica.
- `lib/admin/adapters/adminTaxonomyAdapter.ts` e `components/admin/AdminTaxonCreateForm.tsx` — criação administrativa vigente e exigência de taxon pai.

## 2. Decisões humanas já consolidadas neste debate

### 2.1. Níveis elegíveis para geração

- `segment` é camada de classificação e herança; não é unidade servível para geração de Landing Page.
- `niche` pode ser unidade servível para geração de Landing Page.
- `ultra_niche` pode ser unidade servível para geração de Landing Page, mas não é obrigatório para que um nicho seja utilizável.
- A taxonomia representa a identidade estável do negócio; serviço, produto ou oferta específica de uma Landing Page não deve ser promovido automaticamente a ultranicho.
- Exemplo conceitual: uma clínica geral pode permanecer em `Odontologia` e criar uma LP cuja oferta seja `Implante dentário`; somente uma especialização estrutural do próprio negócio justificaria um ultranicho correspondente.

### 2.2. Hierarquia obrigatória

- `segment` é raiz e não possui pai.
- `niche` exige exatamente um pai de nível `segment`.
- `ultra_niche` exige exatamente um pai de nível `niche`, que por sua vez pertence a um `segment`.
- Não existe nicho ou ultranicho operacional isolado da cadeia canônica.
- A regra já é aplicada pela criação administrativa vigente e pelo resolver do catálogo E20.2; este recorte deve preservá-la, não criar uma segunda autoridade.

### 2.3. Regra de herança dos fields E20.2

- A resolução continua cumulativa na ordem `universal → segmento → nicho → ultranicho`.
- Um field só deve nascer em uma camada ancestral quando sua semântica for válida para os descendentes abrangidos por essa camada.
- Fields específicos de uma profissão ou especialidade não devem ser elevados ao segmento apenas para reutilização.
- Exemplo conceitual: em um segmento amplo como `Saúde e Bem-estar`, `CRM` não é field apropriado do segmento porque não se aplica a odontologia e a outras atividades; eventual registro médico pertence ao nicho médico correspondente, enquanto registro odontológico pertence ao nicho odontológico correspondente.
- Nichos e ultranichos herdam os fields válidos dos ancestrais e acrescentam ou especializam somente o necessário, conforme o contrato E20.2 vigente.

### 2.4. Taxon versus oferta da LP

- Taxon responde essencialmente `que tipo de negócio é este?`.
- A oferta da LP responde `o que este negócio está oferecendo nesta página?`.
- `primary_service_or_offer` permanece no domínio da configuração/oferta da LP e não deve ser convertido em taxon por conveniência.
- Essa separação evita explosão taxonômica por produto, serviço, campanha ou página.

### 2.5. Especialização da geração e portfólio de ofertas da LP

- A identidade taxonômica da conta permanece estável, mas uma Landing Page pode precisar de contexto mais especializado quando a oferta corresponde a um descendente preparado do taxon da conta.
- Direção funcional aprovada para aprofundamento: separar `taxon primário da conta` de `taxon de geração da LP`; o segundo pode ser o próprio taxon primário ou um descendente ativo e preparado, sem reclassificar a conta.
- A pesquisa integral não forma uma segunda árvore: ela continua vinculada ao taxon correspondente. Ao usar um descendente como contexto de geração, pesquisa E20.5 e resolução E20.2 devem permanecer alinhadas à mesma cadeia taxonômica até esse descendente.
- Exemplo: conta em `Odontologia` pode gerar uma LP genérica com a pesquisa de `Odontologia` ou uma LP de `Implante dentário` usando o descendente preparado `Implante dentário`, sua pesquisa integral e a resolução E20.2 `universal → segmento → Odontologia → Implante dentário`.
- A UX não deve exigir que o cliente compreenda `taxon`, `ultranicho`, E20.2, E20.5 ou E20.6. A pergunta de produto deve ser equivalente a `O que esta página vai divulgar?`.
- A Landing Page pode ter foco em um serviço principal ou apresentar vários serviços do negócio. Esses casos não devem ser confundidos:
  - página especializada: uma oferta principal orienta o foco comercial e pode selecionar um descendente preparado como contexto de geração;
  - página ampla: pode apresentar vários serviços do negócio e normalmente permanece no taxon da conta como contexto de geração;
  - página especializada pode mencionar serviços secundários sem transformar todos em ofertas principais nem em novos taxons.
- Direção de UX aprovada para aprofundamento: o negócio mantém um conjunto de serviços/ofertas reutilizáveis; ao configurar a LP, o humano pode escolher `um serviço principal` ou `vários serviços`, selecionar itens já conhecidos e acrescentar item livre quando necessário.
- A seleção de vários serviços deve ser opcional por LP. Ela serve, por exemplo, para uma página institucional de `Odontologia` que queira apresentar `Implante dentário`, `Clareamento`, `Extração de siso` e `Tratamento de canal` na mesma página.
- O contrato atual `business_offerings_summary` é texto livre, opcional e não exaustivo; sozinho, não oferece a estrutura necessária para uma UX de selecionar quatro entre vários serviços. A eventual representação estruturada de portfólio compartilhado e seleção específica por LP deve ser avaliada pela E20.2/E19.5 no menor desenho necessário, sem assumir agora field, tabela, coluna ou persistência.
- `primary_service_or_offer` continua singular enquanto o contrato vigente da E19.5 não for deliberadamente alterado; página multi-serviço não implica automaticamente múltiplas ofertas principais.
- Itens livres repetidamente informados por diferentes contas podem se tornar sinal de demanda para pesquisa e eventual novo ultranicho, mas nunca criam taxon ou pesquisa automaticamente. A forma de detectar, agregar e propor esses sinais pertence a recorte futuro e não autoriza job, agente ou automação neste rascunho.

## 3. Rota conceitual da primeira parte — preparação do taxon

### 3.1. Sequência

- Criar ou validar o taxon e sua cadeia canônica.
- Exigir que o taxon servível seja `niche` ou `ultra_niche` ativo.
- Produzir e arquivar a pesquisa integral `end_customer` do taxon servido.
- E20.5 seleciona explicitamente a versão integral autorizada da pesquisa.
- E20.6 confronta a pesquisa selecionada com a versão E20.2 aplicável ao taxon.
- Se o catálogo for suficiente, a decisão humana registra a revisão factual correspondente.
- Se houver gap factual real, o ajuste retorna à E20.2 e segue seu lifecycle versionado; a E20.2.8 governa publicação e propagação da nova versão.
- O taxon fica preparado somente quando o predicado vigente da E20.6 for satisfeito.

### 3.2. Limite do estado `taxon preparado`

- `taxon preparado` significa somente que existe pesquisa integral autorizada e catálogo factual E20.2 suficiente/compatível para aquele taxon.
- Não significa disponibilidade comercial.
- Não significa entitlement de uma conta.
- Não significa configuração concreta completa de cliente ou LP.
- Não significa LP gerada, aprovada ou publicada.

## 4. Comercial — separação de autoridade

### 4.1. Decisão de fronteira

- Preparação factual do taxon e disponibilidade comercial permanecem responsabilidades distintas.
- O contrato vigente reserva E20.4 para disponibilidade comercial por `taxon + plano`; este rascunho não redefine essa autoridade.
- Entitlement da conta permanece responsabilidade comercial da E9 e é aplicado posteriormente no fluxo concreto da conta.
- A segunda parte do debate deverá distinguir claramente: `taxon preparado`, `taxon comercialmente disponível` e `conta autorizada a gerar`.

## 5. Pontos ainda abertos

### 5.1. Debate pendente

- Definir o menor enforcement necessário para impedir que `segment` seja tratado como taxon servível por E20.5/E20.6/E19, sem duplicar validações já existentes.
- Definir o contrato funcional exato do `taxon de geração da LP`, inclusive default, confirmação humana, troca posterior e efeito sobre a identidade comercial da LP.
- Definir se e como o portfólio compartilhado do negócio precisa evoluir de `business_offerings_summary` livre para representação estruturada, preservando a menor complexidade e sem criar catálogo avançado de ofertas por antecipação.
- Definir a UX final para `um serviço principal` versus `vários serviços`, inclusive como serviços livres entram sem virar taxon automaticamente.
- Verificar se a disponibilidade comercial E20.4 precisa ser implementada para o MVP imediato ou apenas formalizada antes da abertura para novos clientes.
- Definir a segunda parte da rota: critérios de uma conta concreta para criar e gerar suas LPs quando o taxon já estiver preparado e comercialmente elegível.
- Somente após o fechamento dessas decisões consolidar plano-base v1, atualizar `docs/roadmap.md` e autorizar implementação.
