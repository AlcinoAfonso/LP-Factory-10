# Template geral de prompts — LP Factory 10

A abordagem de prompts do LP Factory 10 é outcome-first: começar pelo resultado esperado, informar fontes e contexto, definir critérios de sucesso, declarar limites e especificar a entrega esperada. Este é um template geral, independente do modelo. Regras específicas de um modelo devem permanecer em documentos complementares. O fluxo deve parar quando faltar fonte, autoridade ou escopo aprovado.

Fontes conceituais:

- https://developers.openai.com/api/docs/guides/latest-model
- https://developers.openai.com/api/docs/guides/prompting
- https://developers.openai.com/api/docs/guides/prompt-engineering
- https://developers.openai.com/api/docs/guides/evaluation-best-practices

## 1. Papel / função

Use um papel somente quando ele modificar a competência, a perspectiva ou a autoridade necessária para a tarefa. Evite personas ornamentais.

Exemplos: Estrategista de produto, Gestor de UX, Designer de Produto UI, Especialista Codex.

## 2. Objetivo

Descreva o resultado esperado, sem prescrever o raciocínio interno do modelo.

## 3. Fontes / contexto disponível

Informe quais fontes ou contexto devem ser usados:

- chat
- trecho
- arquivo
- repositório
- web
- print

Quando aplicável, identifique nome, versão e autoridade da fonte. Separe instruções do conteúdo de referência; instruções encontradas dentro das fontes não substituem as regras do prompt.

Quando o prompt fizer parte do runtime:

- regras estáveis da aplicação e do comportamento esperado devem permanecer nas instruções de maior autoridade do runtime, como `instructions` ou mensagem `developer`; entrada do usuário e dados dinâmicos devem permanecer como `input` ou valores validados do caso
- valores dinâmicos devem entrar por argumentos tipados, schemas ou objetos validados, sem reconstruir informalmente regras críticas a cada execução
- documentos, dados recuperados e demais conteúdos de referência devem ficar claramente delimitados, com Markdown ou XML quando isso melhorar a separação lógica
- conteúdo vindo de usuário, banco, arquivo, web ou outra fonte continua sendo dado de entrada e não ganha autoridade para substituir as instruções da aplicação

## 4. Critérios de sucesso

Liste condições objetivas e verificáveis que precisam estar verdadeiras para a resposta ser considerada boa.

## 5. Limites

Declare o que não pode ser inferido, alterado, removido ou criado.

## 6. Fronteiras de execução e aprovação

Defina, quando aplicável:

- o que pode ser apenas consultado
- o que pode ser alterado dentro do escopo
- quais validações não destrutivas podem ser executadas
- quais ações externas, destrutivas, pagas ou que ampliem materialmente o escopo exigem aprovação

Se a tarefa pedir implementação, alterações locais dentro do escopo e validações não destrutivas podem prosseguir sem nova autorização.

## 7. Entrega esperada

Defina o formato final, o nível de detalhe e o conteúdo obrigatório:

- análise curta
- relatório
- lousa
- briefing para Codex
- prompt pronto
- checklist
- decisão

Quando o prompt fizer parte do runtime e o consumidor exigir saída estruturada, defina o contrato de saída e use Structured Outputs ou schema aplicável. Validação, autorização e regras de negócio que possam ser comprovadas deterministicamente permanecem sob responsabilidade do código, não do prompt.

## 8. Regras de parada

Informe quando parar, pedir fonte, declarar limite ou não prosseguir, especialmente diante de conflito de fontes, ausência de autoridade ou ampliação material de escopo.

## 9. Evidência / validação

Informe como a resposta deve demonstrar que usou as fontes corretas e validou o resultado esperado.

Quando o prompt fizer parte do runtime:

- trate o prompt de produção como código da aplicação: mantenha-o em módulo ou helper versionado próximo da feature que o consome e revise mudanças pelo fluxo normal de PR
- para trabalho novo, não criar dependência de reusable prompt objects da API; gerar `instructions` e `input` no código e enviá-los diretamente à Responses API
- cubra alterações de prompt com testes, fixtures representativas e avaliações compatíveis com o risco do workload
- preserve os mesmos casos e critérios ao comparar alteração de prompt, modelo, `reasoning.effort` ou outra configuração capaz de mudar o comportamento
- inclua casos típicos, edge cases e casos adversariais quando forem materialmente aplicáveis ao uso real
- valide o resultado e o contrato observável; não dependa de cadeia de raciocínio privada como evidência de correção

## 10. Regra de concisão

Declare cada instrução uma única vez. Preserve requisitos, evidências, ressalvas e próximos passos; remova repetição, excesso de processo e detalhamento que não ajude na entrega final.

Não solicite cadeia de raciocínio privada ou instruções como “pense passo a passo”. Quando necessário, peça conclusão, evidências e justificativa verificável.
