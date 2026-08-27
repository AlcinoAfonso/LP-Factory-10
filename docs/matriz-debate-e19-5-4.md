# Matriz de debate — E19.5.4 — revisão do modelo mental do workspace de LPs

## 1. Estado e finalidade

- Documento: matriz temporária de debate da revisão da E19.5.4.
- Estado: rascunho vivo; não constitui plano-base v1/v2 nem autorização de implementação.
- Motivo da reabertura: QA humano do PR #820 reprovou a experiência por falta de visão geral prática, criação pouco intuitiva e detalhe excessivamente longo/confuso.
- PR de implementação reprovado: #820; permanece fora desta revisão documental e não deve ser usado como autoridade de UX.
- Plano vigente que está sendo reavaliado: `docs/lousa-plano-base-e19-5-4.md`.
- Fonte principal de visão: `README.md`.
- Processo: `docs/prompt-estrategista.md` v35.
- Objetivo deste documento: registrar decisões humanas e hipóteses ainda abertas, permitir pareceres independentes de outros chats/roles e consolidar somente depois o novo contrato da E19.5.4.

## 2. Regras para contribuição dos outros chats

- Cada parecer deve referenciar os IDs da matriz abaixo.
- O parecer pode classificar cada item como `converge`, `diverge`, `ajuste sugerido` ou `sem opinião material`.
- O chat deve explicar de forma curta o motivo e, quando divergir, propor alternativa concreta.
- Parecer não altera automaticamente a decisão humana registrada.
- O Estrategista consolida os pareceres e submete ao humano qualquer conflito material antes de alterar o plano-base.
- Não implementar código, banco, rota, migration, job, agente, automação ou nova infraestrutura a partir desta matriz.
- Enquanto o debate estiver aberto, não transformar hipóteses em contrato executável.

## 3. Matriz de decisões e questões abertas

| ID | Tema | Posição humana atual / hipótese de trabalho | Estado | Parecer Analista | Parecer Estrutural | Parecer UX/Produto | Outros pareceres | Consolidação do Estrategista |
|---|---|---|---|---|---|---|---|---|
| `MM-01` | Unidade percebida pelo cliente | `LP 01`, `LP 02`, `LP 03` devem ser percebidas como landing pages concretas, não como grupos de versões. | decisão humana em formação, fortemente convergente | — | — | — | — | pendente |
| `MM-02` | Versões | `V1`, `V2`, `V3...` devem representar histórico/evolução da mesma LP e ficar dentro do detalhe dessa LP, não como unidade principal da home. | hipótese forte | — | — | — | — | pendente |
| `MM-03` | Grupo de LPs | Agrupamento deve ser opcional e secundário; cliente com uma ou poucas LPs pode nunca precisar usá-lo. | hipótese forte | — | — | — | — | pendente |
| `MM-04` | Finalidade do grupo | Grupo pode organizar LPs relacionadas, inclusive futuras variações/testes A/B, campanha, oferta ou outro contexto real; não presumir que A/B seja a única finalidade. | questão aberta | — | — | — | — | pendente |
| `MM-05` | Visualização da home | Visão padrão proposta: `Todas as LPs`, uma linha por landing page. Visão alternativa opcional: `Por grupos`, apenas quando houver grupos reais. | hipótese forte | — | — | — | — | pendente |
| `MM-06` | Grupo obrigatório | Não criar automaticamente um grupo para cada LP e não tornar grupo requisito para criação. | hipótese forte | — | — | — | — | pendente |
| `MM-07` | Nome do grupo | `Grupo` / `Grupo de landing pages` é apenas nome provisório; `Identidade da LP` não deve ser usado como nome do agrupador. | questão aberta | — | — | — | — | pendente |
| `ID-01` | Identidade — `funnel_stage` | Funil muda materialmente a identidade da LP e é condição necessária da identidade. | decisão humana aceita | — | — | — | — | pendente |
| `ID-02` | Identidade — `transaction_intent` | Quando aplicável ao taxon, representa intenção comercial materialmente distinta e muda a identidade da LP. | decisão humana aceita | — | — | — | — | pendente |
| `ID-03` | Aplicabilidade de `transaction_intent` | Não é universal. Só deve existir em taxons nos quais haja intenções comerciais distintas que mudem o papel do negócio na transação; não forçar equivalentes artificiais em outros nichos. | decisão humana aceita como regra conceitual | — | — | — | — | pendente |
| `ID-04` | Camada taxonômica de `transaction_intent` | A IA da E20.6 deve avaliar necessidade/cobertura e sugerir `universal`, `segment`, `niche` ou `ultra_niche`; humano mantém autoridade final e E20.2 materializa o contrato aprovado. | decisão humana aceita | — | — | — | — | pendente |
| `ID-05` | Critério para IA E20.6 | Ao avaliar necessidade semelhante a `transaction_intent`, não presumir universalidade; recomendar a camada mais alta em que a semântica permaneça válida sem generalização artificial. | proposta de regra a validar | — | — | — | — | pendente |
| `ID-06` | `primary_conversion_goal` | Ainda não decidido se pertence ao núcleo de identidade ou se deve ser configuração mutável da LP. | aberto | — | — | — | — | pendente |
| `ID-07` | `primary_service_or_offer` | Ainda não decidido se pertence ao núcleo de identidade ou se deve ser tratado como oferta/contexto mutável, eventualmente relacionado ao grupo opcional. | aberto | — | — | — | — | pendente |
| `ID-08` | Resultados desejados dos campos de identidade | Os fields que formam a identidade da LP devem contribuir materialmente para os seis resultados definidos na seção 3.1. | decisão humana aceita | — | — | — | — | pendente |
| `PL-01` | Starter e simplicidade | Hipótese de produto: Starter pode ter baixa quantidade de LPs e publicação restrita; isso reforça UX simples, mas limites exatos de publicação/LPs não são fixados nesta matriz sem contrato comercial vigente. | hipótese contextual; não contratual | — | — | — | — | pendente |
| `UX-01` | Resultado do PR #820 | O desenho implementado não deve ser corrigido por remendos antes de fechar o novo modelo mental; QA humano foi reprovado. | decisão humana | — | — | — | — | pendente |
| `UX-02` | Próximo wireframe | O próximo wireframe deve começar pela visão `Todas as LPs`, uma linha por LP concreta, e somente depois demonstrar a opção `Por grupos`. | direção proposta | — | — | — | — | pendente |

### 3.1. Seis resultados desejados dos campos de identidade

- Objetivo comercial inequívoco: a LP deve saber qual resultado comercial pretende alcançar.
- Persuasão adequada ao momento do público: argumento, profundidade e abordagem devem ser compatíveis com o funil e, quando aplicável, com a intenção comercial.
- Narrativa coerente e progressiva: a copy deve ter início, desenvolvimento e conclusão, evitando uma coleção desconectada de blocos.
- Unidade de mensagem: oferta, argumentos, objeções, benefícios e CTA devem apontar para o mesmo trabalho comercial.
- Conversão coerente com a narrativa: a ação principal deve decorrer naturalmente da persuasão construída pela página, e não funcionar como CTA arbitrário.
- Especificidade: os campos de identidade devem ajudar a produzir uma LP específica para aquele trabalho comercial, evitando copy genérica que poderia servir para qualquer cliente, oferta ou objetivo.

## 4. Perguntas que ainda precisam de decisão humana

### 4.1. Modelo mental e agrupamento

- Qual é o nome final do agrupador opcional?
- Quais casos justificam criar um grupo no MVP e quais ficam para evolução?
- O usuário cria o grupo explicitamente ou ele só aparece em funcionalidades futuras específicas?
- A visualização `Por grupos` deve existir no MVP inicial ou apenas ser preservada como evolução após a lista plana estar validada?

### 4.2. Identidade da LP

- `primary_conversion_goal` muda identidade ou apenas estratégia de conversão da mesma LP?
- `primary_service_or_offer` muda identidade sempre, às vezes, ou deve ser tratado como contexto/oferta mutável?
- Depois de responder aos dois itens acima, qual é o núcleo mínimo de identidade visível ao cliente?

### 4.3. E20.6 e E20.2

- Qual formulação exata deve entrar nas instruções do workload E20.6 para sugerir camada taxonômica sem generalização artificial?
- A regra deve ser genérica para qualquer novo field ou existir também uma orientação específica para dimensões de intenção comercial?
- Como registrar a decisão aprovada na E20.2 sem duplicar autoridade entre E20.2, E20.6 e E19.5?

## 5. Critério de encerramento desta matriz

- Encerrar o debate somente quando o humano tiver decidido o modelo mental principal, o papel do grupo opcional e o núcleo mínimo de identidade.
- Antes de consolidar novo plano executável, incorporar as decisões aprovadas no documento canônico da E19.5.4 e nos documentos próprios materialmente afetados, sem redundância.
- Esta matriz é artefato de debate e deve ser removida quando deixar de ser necessária, salvo nova decisão humana explícita.
