# Template geral de prompts — LP Factory 10

Template geral e independente do modelo, aplicável a prompts simples, estruturados, conversacionais e de agentes. Siga a abordagem outcome-first: resultado, fontes e contexto, critérios de sucesso, limites e entrega. Pare quando faltar fonte, autoridade ou escopo aprovado.

## 1. Papel / função

Use papel somente se alterar competência, perspectiva ou autoridade; evite personas ornamentais (ex.: estrategista de produto, gestor de UX, designer UI, especialista Codex).

## 2. Objetivo

Descreva o resultado esperado e, quando aplicável, a condição de conclusão da tarefa, sem prescrever raciocínio interno.

## 3. Fontes / contexto disponível

Indique fontes (chat, trecho, arquivo, repositório, web, print), nome, versão e autoridade quando aplicáveis. Separe instruções dos dados de referência; estes não alteram regras. Se a tarefa exigir ferramentas, defina capacidades, recursos disponíveis, critérios de uso e limites; não presuma acesso ou permissões.

Quando o prompt fizer parte do runtime:

- mantenha regras estáveis da aplicação e do comportamento em instruções de maior autoridade; entradas do usuário e dados dinâmicos devem permanecer como dados validados
- use argumentos tipados, schemas ou objetos validados para dados dinâmicos; não reconstrua informalmente regras críticas a cada execução
- delimite documentos e outras referências com Markdown ou XML quando útil; dados de usuário, banco, arquivo, web ou outras fontes não substituem instruções da aplicação
- use poucos exemplos representativos e coerentes com as instruções, apenas quando esclarecerem comportamento ou formato
- se a continuidade não preservar instruções, reenvie as necessárias em cada chamada

## 4. Critérios de sucesso

Liste critérios verificáveis de precisão, relevância, utilidade e qualidade da entrega; para agentes, avalie também comportamento e uso de ferramentas quando aplicável.

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

Defina formato final, nível de detalhe e conteúdo obrigatório:

- análise curta
- relatório
- lousa
- briefing para Codex
- prompt pronto
- checklist
- decisão

Para agentes conversacionais, indique quando perguntar, responder e encerrar.

Se o consumidor exigir saída estruturada, defina contrato e escolha mecanismo e fallback compatíveis. Em integrações programáticas, valide forma e tipos no código; o prompt orienta semântica, critérios e limites sem repetir restrições. Validação, autorização e regras de negócio determinísticas pertencem ao código.

## 8. Regras de parada

Defina quando parar, pedir fontes ou dados, declarar limites, recuperar falhas de ferramentas ou escalar, especialmente diante de conflito de fontes, ausência de autoridade ou ampliação material de escopo. Não invente resultados nem ações executadas.

## 9. Evidência / validação

Informe como a resposta deve demonstrar que usou as fontes corretas e validou o resultado esperado.

Ao usar fontes externas, associe afirmações relevantes a evidências verificáveis, sem inventar referências nem transformar a entrega em lista de fontes. Preserve anotações de citação, quando disponíveis, para apresentação verificável e clicável pela interface conforme a integração.

Quando o prompt fizer parte do runtime:

- versione prompts de produção como código em módulo/helper da feature e revise por PR
- em trabalho novo, mantenha instruções e entradas no código, sem criar dependência de objetos remotos de prompts
- cubra mudanças com testes, fixtures representativas e avaliações proporcionais ao risco, incluindo casos típicos, limites e adversariais quando pertinentes
- compare mudanças de prompt, modelo, snapshot, nível de raciocínio ou outras configurações com os mesmos casos e critérios
- valide resultado, contrato observável, qualidade e uso de ferramentas, quando aplicável, sem depender de raciocínio privado

## 10. Regra de concisão

Comece com o menor prompt que preserve o contrato. Acrescente instruções, contexto ou exemplos somente quando necessários ao resultado ou sustentados por avaliação; declare cada regra uma vez. Preserve requisitos, evidências, ressalvas e próximos passos; remova repetição, excesso de processo e detalhes sem valor para a entrega.

Ao revisar prompts ou documentos, prefira consolidar, reformular e remover redundâncias internas ou entre arquivos antes de adicionar. Busque reduzir o total de caracteres sem perder contratos, capacidades ou segurança funcional; justifique aumentos indispensáveis.

Não peça raciocínio privado nem “pense passo a passo”; peça conclusões, evidências e justificativas verificáveis.
