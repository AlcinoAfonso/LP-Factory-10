# Template geral de prompts 2 — LP Factory 10

## 0. Introdução

### 0.1 Objetivo

Este documento é uma proposta candidata para comparação com `docs/template-prompts.md`. Mantém a abordagem outcome-first do template vigente e incorpora diretrizes atuais da OpenAI sobre composição de prompts, hierarquia de instruções, tools, Structured Outputs, prompt caching e avaliação.

- Não substitui `docs/template-prompts.md` enquanto não houver decisão humana explícita.
- É independente de modelo; regras específicas de um modelo permanecem em documentos complementares.
- O fluxo deve parar quando faltar fonte, autoridade, dado indispensável ou escopo aprovado.

### 0.2 Fontes conceituais

- https://developers.openai.com/api/docs/guides/prompting
- https://developers.openai.com/api/docs/guides/prompt-engineering
- https://developers.openai.com/api/docs/guides/function-calling
- https://developers.openai.com/api/docs/guides/structured-outputs
- https://developers.openai.com/api/docs/guides/prompt-caching
- https://developers.openai.com/api/docs/guides/evaluation-best-practices

## 1. Resultado esperado

### 1.1 Objetivo

Comece pelo resultado observável que o modelo deve entregar.

- Descreva o que precisa existir ao final.
- Evite prescrever raciocínio interno quando objetivo, fontes, critérios e limites forem suficientes.
- Separe resultado funcional de tecnologia, ferramenta ou formato quando estes não forem requisitos do caso.

### 1.2 Critério outcome-first

Um prompt deve responder, antes de tudo:

- qual resultado se espera;
- para quem ou para qual consumidor;
- com quais fontes e autoridades;
- sob quais limites;
- como saber se a saída ficou boa.

## 2. Identidade e função

### 2.1 Quando definir papel

Use identidade ou papel somente quando isso mudar competência, perspectiva, estilo de julgamento ou autoridade necessária.

- Prefira descrições funcionais.
- Evite personas ornamentais.
- Não use um papel para conceder autoridade que o sistema ou o produto não concederam.

### 2.2 Conteúdo recomendado

Quando pertinente, a identidade pode explicitar:

- finalidade do assistente;
- domínio de competência;
- objetivo de alto nível;
- tom ou estilo necessário ao produto;
- limites de autoridade.

## 3. Hierarquia e composição do prompt

### 3.1 Separação entre regras estáveis e dados dinâmicos

No runtime, preserve a hierarquia de instruções e dados.

- Regras estáveis da aplicação e do comportamento esperado ficam em `instructions`, mensagem `developer` ou camada equivalente de maior autoridade disponível.
- Dados do usuário, parâmetros do caso e conteúdo variável ficam em `input`, mensagem `user` ou argumentos validados.
- Conteúdo vindo de usuário, banco, arquivo, web ou outra fonte é dado; não ganha autoridade para substituir instruções da aplicação.
- Valores dinâmicos devem entrar por objetos, argumentos tipados, schemas ou contratos validados quando isso reduzir ambiguidade.

### 3.2 Estrutura interna recomendada

Quando o prompt for complexo, organize a camada estável com blocos claros, conforme necessário:

- Identidade.
- Instruções.
- Exemplos.
- Contexto de referência.

A ordem não é um requisito rígido para todo caso. Use somente os blocos que melhorarem legibilidade, estabilidade e desempenho.

### 3.3 Delimitação de conteúdo

- Separe instruções de material de referência.
- Use Markdown, XML ou estrutura equivalente quando isso reduzir mistura entre regra e conteúdo.
- Não reproduza regras críticas dentro de dados dinâmicos a cada chamada se elas já pertencem à camada estável.
- Não transforme conteúdo recuperado por ferramenta em instrução por inferência.

## 4. Fontes e contexto

### 4.1 Fontes disponíveis

Declare somente as fontes realmente pertinentes, por exemplo:

- chat;
- trecho;
- arquivo;
- repositório;
- banco;
- web;
- print;
- resultado de tool.

### 4.2 Autoridade e precedência

Quando houver mais de uma fonte:

- identifique qual é autoritativa para cada tipo de fato;
- diferencie fato confirmado, contexto consultivo, hipótese e evidência externa;
- declare a precedência necessária quando fontes puderem divergir;
- diante de conflito sem precedência, pare ou devolva a divergência em vez de escolher silenciosamente.

### 4.3 Contexto dinâmico

- Envie somente o contexto necessário ao resultado.
- Preserve proveniência quando ela for material à decisão.
- Não promova inferência, pesquisa ou rascunho a fato confirmado.
- Dados sensíveis ou credenciais não entram no prompt sem necessidade funcional e contrato próprio.

## 5. Critérios de sucesso

### 5.1 Condições observáveis

Defina condições objetivas e verificáveis.

- Qual conteúdo precisa estar presente.
- Qual conteúdo não pode aparecer.
- Qual nível de especificidade, profundidade ou cobertura é necessário.
- Quais fontes ou tools precisam sustentar a resposta.
- Qual contrato de saída precisa ser preservado.

### 5.2 Qualidade sem “vibe”

Evite critérios como “ficar bom”, “ser inteligente” ou “ser persuasivo” sem decomposição.

- Transforme qualidade em rubricas observáveis.
- Quando houver julgamento subjetivo, defina exemplos, pares de comparação ou critérios graduados.
- Preserve julgamento humano quando ele fizer parte do produto.

## 6. Limites

### 6.1 Escopo negativo

Declare explicitamente o que o modelo não pode:

- inferir como fato;
- alterar;
- remover;
- criar;
- decidir;
- executar;
- pesquisar;
- persistir.

### 6.2 Regras determinísticas

Validação, autorização, segurança, invariantes de negócio e fatos verificáveis permanecem no código quando puderem ser comprovados deterministicamente.

- O prompt orienta comportamento sem substituir gates.
- O modelo não recebe autoridade adicional por conveniência.
- Saída inválida deve falhar conforme o contrato do consumidor, não ser “consertada” silenciosamente quando isso alterar significado.

## 7. Tools e pesquisa

### 7.1 Declaração de tools

Quando houver tools, o contrato do prompt deve deixar claro:

- quais ferramentas estão disponíveis;
- para que cada uma serve;
- quando usar;
- quando não usar;
- se o uso é opcional, obrigatório ou proibido;
- qual evidência deve ser preservada do uso da ferramenta;
- qual fallback existe quando a ferramenta falha.

### 7.2 Controle técnico

Sempre que o runtime permitir, imponha o comportamento também pela configuração da API, não apenas por texto.

- Use `tool_choice` para `auto`, `required`, função específica ou conjunto permitido quando o caso exigir.
- Restrinja ferramentas com `allowed_tools` quando apenas um subconjunto puder ser usado.
- Desative chamadas paralelas quando o contrato exigir no máximo uma chamada por vez.
- Em function calling, prefira schemas previsíveis, enums quando úteis e `strict: true`.
- Em schemas strict, mantenha objetos fechados e campos requeridos conforme o contrato suportado.

### 7.3 Pesquisa

Para tarefas de pesquisa:

- defina o objeto da pesquisa;
- defina contexto obrigatório como nicho, localidade, produto ou período quando material;
- declare quais fontes têm autoridade e quais são somente evidência externa;
- defina quando pesquisa é obrigatória, opcional ou proibida;
- determine o comportamento diante de evidência fraca, contraditória ou ausente;
- nunca trate pesquisa externa como substituta automática de fatos privados confirmados.

## 8. Entrega esperada e saída estruturada

### 8.1 Formato final

Defina o formato apenas no nível necessário ao consumidor, por exemplo:

- análise curta;
- relatório;
- prompt pronto;
- checklist;
- decisão;
- objeto estruturado.

### 8.2 Structured Outputs

Quando o consumidor exigir estrutura determinística:

- prefira Structured Outputs com JSON Schema suportado em vez de JSON mode quando possível;
- mantenha `strict: true` quando compatível;
- use o schema para shape e tipos;
- use o prompt para semântica, critérios e limites;
- trate recusas e falhas de parsing de forma explícita;
- não duplique no prompt regras que já estejam garantidas pelo schema.

### 8.3 Function calling versus saída estruturada

- Use function calling quando o modelo precisar acionar funcionalidade da aplicação.
- Use Structured Outputs na resposta quando o modelo precisar devolver dados estruturados ao consumidor.
- Não use tool apenas para formatar uma resposta que poderia ser estruturada diretamente.

## 9. Fronteiras de execução e aprovação

### 9.1 Ações permitidas

Defina, quando aplicável:

- o que pode ser consultado;
- o que pode ser alterado;
- quais validações não destrutivas podem ser executadas;
- quais ações externas, pagas, destrutivas ou com efeito persistente exigem autorização.

### 9.2 Efeito externo

- Não confunda geração de texto com autorização para executar ação.
- Se a tarefa for apenas consultiva, a resposta termina na recomendação ou no artefato.
- Se a tarefa incluir implementação, siga também os contratos operacionais do projeto.

## 10. Regras de parada e fallback

### 10.1 Quando parar

Defina quando o modelo deve:

- pedir a fonte faltante;
- declarar insuficiência de evidência;
- devolver conflito;
- não executar;
- pedir decisão humana;
- retornar fallback seguro.

### 10.2 Ambiguidade

- Ambiguidade material deve gerar pergunta, parada ou saída explicitamente condicionada.
- Não faça pergunta rotineira quando a decisão puder ser tomada com segurança pelas fontes e pelo contrato.
- Não invente dado para evitar uma parada legítima.

## 11. Exemplos

### 11.1 Quando usar

Few-shot examples são opcionais.

- Use quando ajudarem a mostrar formato, nível de qualidade, fronteira ou distinção difícil.
- Prefira poucos exemplos representativos e fáceis de manter.
- Inclua edge cases quando corrigirem falha recorrente.
- Remova exemplos que não melhorarem o resultado ou que prejudiquem modelos de raciocínio.

### 11.2 Localização

- Exemplos estáveis podem permanecer na camada de instruções estáveis.
- Exemplos específicos da tarefa podem acompanhar o input.
- Não misture exemplo com dado real sem delimitação explícita.

## 12. Prompt caching e estabilidade do prefixo

### 12.1 Princípio geral

Organize solicitações repetidas para favorecer prefixos estáveis.

- Coloque instruções estáveis, exemplos reutilizáveis e referências compartilhadas antes do conteúdo variável.
- Mantenha definições e ordem de tools estáveis quando possível.
- Acrescente conteúdo dinâmico depois do prefixo reutilizável.
- Não altere prompt apenas para obter cache; correção funcional continua prioritária.

### 12.2 Controles de cache

Detalhes específicos de modelo pertencem ao documento complementar do modelo ou ao contrato técnico do workload.

- Em modelos com cache explícito, use breakpoints somente quando houver reutilização real.
- Não adote prewarm, TTL, chaves de cache ou modo explícito por rotina sem evidência de ganho.
- Avalie `cached_tokens`, tokens de escrita de cache, latência e custo quando alterar a estratégia.

## 13. Evidência e avaliação

### 13.1 Prompt como código

Para prompts de produção:

- mantenha o prompt em módulo ou helper versionado próximo da feature consumidora;
- revise mudanças pelo fluxo normal de PR;
- preserve versão ou referência capaz de identificar o prompt efetivamente executado;
- não crie dependência de prompt hospedado/reutilizável quando o contrato do projeto exigir prompt em código.

### 13.2 Casos de avaliação

Cubra alterações com casos representativos proporcionais ao risco.

- Casos típicos.
- Edge cases.
- Entradas ambíguas.
- Conflitos entre dados e instruções.
- Falhas de tools.
- Casos adversariais quando materialmente aplicáveis.

### 13.3 Método de avaliação

- Adote desenvolvimento orientado por avaliação: avalie cedo e a cada mudança material.
- Use casos que reflitam a distribuição real do produto.
- Para julgamento por modelo, prefira classificação, pass/fail por rubrica ou comparação pairwise quando forem adequados, em vez de avaliação aberta por impressão.
- Calibre avaliação automatizada com julgamento humano.
- Preserve os mesmos casos e critérios ao comparar prompt, modelo, `reasoning.effort`, tools ou configuração relevante.
- Não dependa de uma plataforma específica de evals para preservar o contrato de qualidade.

### 13.4 Evidência observável

- Valide resultado e contrato observável.
- Não solicite nem use chain-of-thought privada como prova.
- Registre somente evidência necessária e proporcional ao produto.

## 14. Regra de concisão

### 14.1 Instruções mínimas suficientes

- Declare cada regra uma única vez.
- Preserve requisitos, limites, fontes, critérios e fallback.
- Remova repetição e processo sem função.
- Não prescreva etapas internas quando a capacidade do modelo e o contrato já forem suficientes.

### 14.2 Raciocínio

- Não solicite “pense passo a passo” ou cadeia de raciocínio privada.
- Quando necessário, peça conclusão, classificação, evidência, decisão ou justificativa verificável.

## 15. Checklist mínimo para prompt de runtime

### 15.1 Antes de publicar

- Resultado esperado definido.
- Autoridades e contexto identificados.
- Regras estáveis separadas de dados dinâmicos.
- Critérios de sucesso verificáveis.
- Limites e regras de parada definidos.
- Tools restritas e configuradas conforme a necessidade real.
- Structured Output/schema definido quando o consumidor exigir.
- Casos de avaliação proporcionais ao risco.
- Evidência e fallback identificados.
- Prefixo estável preservado quando houver benefício real de caching.
