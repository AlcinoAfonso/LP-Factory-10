# Template geral de prompts — LP Factory 10

Template geral e independente do modelo, aplicável a prompts simples, estruturados, conversacionais e de agentes. Siga a abordagem outcome-first: resultado, fontes e contexto, critérios de sucesso, limites e entrega. Pare quando faltar fonte, autoridade ou escopo aprovado.

## 1. Papel / função

Use um papel somente quando ele modificar a competência, a perspectiva ou a autoridade necessária para a tarefa. Evite personas ornamentais.

Exemplos: Estrategista de produto, Gestor de UX, Designer de Produto UI, Especialista Codex.

## 2. Objetivo

Descreva o resultado esperado e, quando aplicável, a condição de conclusão da tarefa, sem prescrever raciocínio interno.

## 3. Fontes / contexto disponível

Indique fontes e contexto (chat, trecho, arquivo, repositório, web ou print), com nome, versão e autoridade quando aplicáveis. Separe instruções do conteúdo de referência; fontes não substituem as regras do prompt. Para agentes, indique quando usar ferramentas disponíveis, sem presumir acesso não configurado.

Quando o prompt fizer parte do runtime:

- mantenha regras estáveis da aplicação e do comportamento em `instructions` ou mensagem `developer`; entrada do usuário e dados dinâmicos ficam em `input` ou valores validados
- use argumentos tipados, schemas ou objetos validados para valores dinâmicos, sem reconstruir informalmente regras críticas a cada execução
- delimite documentos, dados recuperados e demais referências com Markdown ou XML quando útil; conteúdo de usuário, banco, arquivo, web ou outra fonte não ganha autoridade sobre instruções da aplicação
- use poucos exemplos representativos apenas quando esclarecerem comportamento ou formato, coerentes com as instruções
- ao usar `previous_response_id`, reenvie instruções necessárias em cada chamada

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

Se o runtime exigir saída estruturada, defina o contrato. Prefira Structured Outputs com schema suportado; caso indisponível, use fallback compatível e valide no código. O schema garante forma e tipos; o prompt orienta semântica, critérios e limites, sem duplicar restrições já garantidas pelo schema. Validação, autorização e regras de negócio determinísticas pertencem ao código.

## 8. Regras de parada

Defina quando parar, pedir fontes ou dados, declarar limites, recuperar falhas de ferramentas ou escalar, especialmente diante de conflito de fontes, ausência de autoridade ou ampliação material de escopo. Não invente resultados nem ações executadas.

## 9. Evidência / validação

Informe como a resposta deve demonstrar que usou as fontes corretas e validou o resultado esperado.

Na pesquisa Web, associe afirmações relevantes a fontes verificáveis, sem inventar referências nem transformar a entrega em lista de fontes. Com Web Search na Responses API, preserve as anotações de citação da API para exibição pela interface como links clicáveis junto às afirmações.

Quando o prompt fizer parte do runtime:

- trate prompts de produção como código: versione-os em módulo/helper próximo da feature e revise mudanças por PR
- em trabalho novo, não crie dependência de reusable prompt objects; gere `instructions` e `input` no código e envie diretamente à Responses API
- cubra mudanças com testes, fixtures representativas e avaliações proporcionais ao risco, incluindo casos típicos, limites e adversariais quando pertinentes
- compare mudanças de prompt, modelo, snapshot, `reasoning.effort` ou outras configurações com os mesmos casos e critérios
- valide resultado, contrato observável, qualidade e uso de ferramentas quando aplicável, sem depender de raciocínio privado

## 10. Regra de concisão

Comece com o menor prompt que preserve o contrato. Acrescente instruções, contexto ou exemplos somente quando necessários ao resultado ou sustentados por avaliação; declare cada regra uma vez. Preserve requisitos, evidências, ressalvas e próximos passos; remova repetição, excesso de processo e detalhes sem valor para a entrega.

Ao revisar prompts ou documentos, prefira consolidar, reformular e remover redundâncias internas ou entre arquivos antes de adicionar. Busque reduzir o total de caracteres sem perder contratos, capacidades ou segurança funcional; justifique aumentos indispensáveis.

Não peça raciocínio privado nem “pense passo a passo”; peça conclusões, evidências e justificativas verificáveis.
