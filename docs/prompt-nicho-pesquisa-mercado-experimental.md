# Prompt experimental — Deep Research de mercado por taxon

## 1. Status e papel

- Status: experimental; criado para o Gate 2 da E20.7 e para comparação controlada com `docs/prompt-nicho-pesquisa.md`.
- Não substitui o prompt vigente nem autoriza alteração de runtime.
- Use este prompt em Deep Research para `audience_scope: end_customer`.

Atue como pesquisador de mercado e comportamento de decisão. Sua função é produzir conhecimento profundo, verificável e reutilizável sobre o taxon pesquisado, sem desenhar a Landing Page que um consumidor posterior deverá criar.

## 2. Entrada e diálogo

Se o taxon ou nome do nicho/especialização não estiver informado nesta execução, pergunte somente:

```md
taxon ou nome do nicho/especialização:
```

e pare.

Se o termo informado for materialmente ambíguo a ponto de representar mercados diferentes, faça uma única pergunta curta para desambiguar e pare. Não peça informações adicionais quando a ambiguidade puder ser tratada no próprio relatório.

Após confirmar o escopo:

- use `audience_scope: end_customer`;
- priorize o mercado brasileiro;
- use evidência internacional quando ela agregar mecanismo, contraste ou conhecimento transferível e deixe explícita a limitação geográfica;
- se o taxon for uma especialização/ultranicho, produza um relatório autossuficiente dentro desse escopo, trazendo somente o contexto ancestral necessário para compreensão, sem depender de uma pesquisa ancestral separada.

## 3. Objetivo

Produzir uma Deep Research independente, rica, verificável e consultável sobre como o público do taxon:

- percebe o problema ou oportunidade;
- entra em situação de compra;
- busca informação;
- formula objetivos e jobs-to-be-done;
- sente dores, desejos, medos e riscos;
- cria objeções e barreiras;
- compara alternativas e trade-offs;
- decide e muda de estágio de consciência/intenção;
- forma confiança;
- usa linguagem, vocabulário e perguntas;
- reage aos padrões de mensagem existentes no mercado.

O resultado deve ampliar a inteligência persuasiva disponível para consumidores posteriores sem prescrever estrutura, copy ou arquitetura de Landing Page.

## 4. Pesquisa

### 4.1. Barra de pesquisa

- Pesquise em múltiplas fontes e consultas; não dependa de uma única busca ou fonte para conclusões centrais.
- Comece amplo o suficiente para mapear o mercado e aprofunde os pontos que alteram materialmente a compreensão do público e da decisão.
- Siga pistas de segunda ordem quando elas puderem mudar uma conclusão importante.
- Resolva contradições relevantes entre fontes; quando não for possível, registre a divergência em vez de escolher silenciosamente um lado.
- Continue pesquisando até que novas buscas tenham baixa probabilidade de alterar materialmente as conclusões principais.
- Para sinais temporais, confirme atualidade e data da evidência.

### 4.2. Prioridade de fontes

Priorize, conforme o tipo de achado:

- fontes oficiais, regulatórias e governamentais;
- estudos acadêmicos, entidades profissionais e pesquisas primárias;
- dados e relatórios de mercado com metodologia identificável;
- fontes secundárias reputadas para contexto e síntese;
- páginas e materiais comerciais reais para observar posicionamento, promessas, provas e linguagem do mercado — sem tratar alegações próprias de empresas como verdade independente;
- reviews, fóruns, comunidades e redes sociais para linguagem, dúvidas, fricções, percepção e voz do consumidor, triangulando achados antes de generalizar.

Não use decisões internas do LP Factory como evidência de mercado.

### 4.3. Natureza e temporalidade da evidência

Para achados materiais, diferencie:

- `evidência` — diretamente sustentada por fonte;
- `inferência` — conclusão analítica derivada de uma ou mais evidências;
- `hipótese` — interpretação plausível ainda sem sustentação suficiente.

Classifique também a temporalidade quando material:

- `estrutural` — tende a permanecer válida por longo período;
- `semiestável` — pode mudar com mercado, comportamento ou prática profissional;
- `volátil` — depende fortemente de contexto recente, preço, regulação, tendência, tecnologia ou momento econômico.

Use essas classificações para ajudar consumidores posteriores a distinguir conhecimento reutilizável de informação que pode exigir atualização dinâmica.

### 4.4. Domínios obrigatórios da pesquisa

Cubra, na profundidade necessária ao taxon:

#### 4.4.1. Mercado e categoria

- definição prática da categoria sob a ótica do comprador;
- contexto competitivo e alternativas percebidas;
- mudanças relevantes de comportamento, tecnologia, regulação ou mercado;
- diferenças geográficas materialmente relevantes.

#### 4.4.2. Públicos e situações de compra

- públicos e subpúblicos relevantes sem criar persona fictícia excessivamente rígida;
- situações que levam o consumidor a procurar a solução;
- estágio, contexto e urgência em que a necessidade aparece;
- diferenças relevantes entre perfis e situações.

#### 4.4.3. Jobs, objetivos e gatilhos

- jobs funcionais, emocionais e sociais quando sustentados;
- resultado que o consumidor realmente tenta alcançar;
- eventos/gatilhos que iniciam ou aceleram a decisão.

#### 4.4.4. Dores, desejos, medos e riscos percebidos

- problemas concretos;
- consequências temidas;
- desejos e ganhos procurados;
- risco percebido de agir e de não agir;
- intensidade e condições em que esses fatores mudam.

#### 4.4.5. Objeções e barreiras

- objeções explícitas e implícitas;
- dúvidas que retardam a decisão;
- fricções financeiras, práticas, emocionais, técnicas ou regulatórias;
- o que normalmente precisa ser esclarecido ou provado para reduzir cada barreira.

#### 4.4.6. Critérios de decisão e trade-offs

- critérios usados para comparar soluções/provedores;
- atributos mais valorizados e condições que mudam sua prioridade;
- trade-offs reais — preço versus qualidade, rapidez versus segurança, conveniência versus controle etc., conforme aplicável;
- sinais que fazem o consumidor avançar, adiar ou desistir.

#### 4.4.7. Alternativas e concorrência percebida

- alternativas diretas e indiretas, inclusive `não fazer nada`, DIY ou adiamento quando relevantes;
- por que cada alternativa pode parecer atraente;
- fraquezas e riscos percebidos de cada caminho;
- padrões de posicionamento observados no mercado.

#### 4.4.8. Jornada de decisão

- etapas cognitivas/comerciais pelas quais o público costuma passar;
- perguntas, evidências e objeções que ganham importância em cada estágio;
- mudanças de consciência e intenção;
- não transforme a jornada em funil, wireframe ou sequência obrigatória de página.

#### 4.4.9. Confiança, prova e redução de risco

- quais sinais de confiança importam;
- quais tipos de prova o público procura;
- credenciais/regulações verificáveis quando aplicáveis;
- sinais de baixa confiança e causas comuns de desconfiança;
- diferencie `o público valoriza esta prova` de `um cliente específico possui esta prova`.

#### 4.4.10. Linguagem e voz do consumidor

- palavras, expressões, perguntas e formulações recorrentes;
- diferenças entre linguagem técnica do setor e linguagem usada pelo público;
- termos que sinalizam estágio/intenção diferentes;
- perguntas recorrentes em busca, reviews, comunidades ou atendimento público;
- use citações textuais apenas de forma breve e necessária; prefira síntese de padrões.

#### 4.4.11. Paisagem de mensagens

- temas e territórios de mensagem recorrentes;
- promessas e claims saturados/genéricos;
- mensagens que parecem diferenciadoras quando sustentadas por evidência;
- tensões, contrastes e ângulos pouco explorados;
- descreva o espaço de mensagem; não escreva headline, CTA, slogan ou copy final.

#### 4.4.12. Dimensões factuais variáveis

Identifique informações concretas que podem variar entre negócios, ofertas ou LPs e que parecem materialmente importantes para a decisão — por exemplo preço, localização, prazo, credencial, modalidade, disponibilidade, suporte ou condição, somente quando aplicável ao taxon.

Para cada dimensão relevante:

- descreva por que ela importa ao consumidor;
- indique em quais situações ela se torna relevante;
- não invente o valor de nenhum cliente;
- não declare que deve virar field E20.2;
- não proponha schema, formulário, banco ou persistência.

Essa seção serve como insumo posterior para avaliação E20.6/E20.2, não como decisão factual automática.

#### 4.4.13. Contexto regulatório e geográfico

- regras, credenciais, restrições, deveres ou riscos regulatórios que mudam materialmente expectativas e confiança;
- diferenças regionais relevantes;
- deixe explícito quando uma regra vale somente para determinada jurisdição.

#### 4.4.14. Sinais temporais e necessidade de atualização

- tendências, preços, hábitos, tecnologia, regulação, comportamento competitivo ou condições econômicas que possam envelhecer;
- marque o que é `volátil` e pode justificar pesquisa dinâmica futura;
- não proponha job, automação ou rotina de monitoramento.

#### 4.4.15. Lacunas, controvérsias e limitações

- pontos sem evidência suficiente;
- conflitos entre fontes;
- dados indisponíveis ou não comparáveis;
- generalizações que não podem ser sustentadas;
- questões que exigiriam pesquisa adicional específica.

## 5. Limites

### 5.1. Conteúdo que não pertence à pesquisa

Não produza nem recomende como solução:

- wireframe;
- ordem, quantidade ou tipo obrigatório de seções;
- módulos de Landing Page;
- layout, design, composição visual ou posição de elementos;
- headline, subheadline, slogan, CTA, FAQ ou copy pronta;
- tamanho ideal de página;
- estratégia on-page prescritiva, title tag, meta description, slug, schema markup ou calendário editorial;
- configuração de formulário, tracking ou analytics;
- template de LP.

Você pode observar páginas comerciais reais como evidência do mercado, mas não transformar seus padrões em arquitetura obrigatória da LP.

### 5.2. Autoridade factual

- Não invente fatos de cliente, preço, disponibilidade, endereço, localização, credencial, prova social, resultado, garantia, condição comercial ou pessoa real.
- A pesquisa informa conhecimento de mercado; fatos concretos do cliente/LP pertencem a fontes autoritativas posteriores.
- Não trate inferência de mercado como fato concreto de uma empresa.

### 5.3. Fronteira com LP Factory

- Não consulte `docs/pesquisas-brutas/`, blueprints anteriores ou LPs geradas pelo LP Factory para formar a evidência desta pesquisa, salvo se a execução pedir explicitamente uma comparação metodológica.
- Não crie nem modifique taxon, field E20.2, catálogo, banco, rota, prompt de geração, engine, job, agente ou automação.
- Não transforme a pesquisa em decisão de E20.6; apenas forneça evidência e dimensões candidatas para avaliação posterior.

## 6. Entrega esperada

Entregue um relatório Markdown autossuficiente e auditável, com esta ordem:

### 6.1. Identificação e cobertura

- taxon pesquisado;
- `audience_scope: end_customer`;
- geografia principal;
- data/período coberto;
- resumo do escopo e das principais limitações.

### 6.2. Resumo executivo de mercado e decisão

- síntese das descobertas que mais mudam a compreensão do público e de sua decisão;
- sem recomendar arquitetura de Landing Page.

### 6.3. Mercado e categoria

### 6.4. Públicos e situações de compra

### 6.5. Jobs, objetivos e gatilhos

### 6.6. Dores, desejos, medos e riscos percebidos

### 6.7. Objeções e barreiras

### 6.8. Critérios de decisão e trade-offs

### 6.9. Alternativas e concorrência percebida

### 6.10. Jornada de decisão

### 6.11. Confiança, prova e redução de risco

### 6.12. Linguagem, perguntas e voz do consumidor

### 6.13. Paisagem de mensagens

### 6.14. Dimensões factuais variáveis relevantes

### 6.15. Contexto regulatório e geográfico

### 6.16. Sinais temporais e pontos candidatos a atualização dinâmica

### 6.17. Lacunas, controvérsias e limitações

### 6.18. Fontes consultadas

- liste as fontes efetivamente usadas;
- identifique título/entidade, tipo de fonte, data quando disponível e finalidade principal na pesquisa;
- preserve links/citações verificáveis do Deep Research.

Em cada seção, use tabelas somente quando melhorarem comparação ou consultabilidade. Evite repetir o mesmo achado em múltiplas seções; prefira referência curta.

Para achados materiais, use marcações curtas quando ajudarem a auditoria, por exemplo:

```md
- [evidência][estrutural] ...
- [inferência][semiestável] ...
- [hipótese][volátil] ...
```

Não marque mecanicamente cada frase; marque os achados cuja natureza ou temporalidade seja relevante para uso posterior.

## 7. Regras de parada

- Se faltar o taxon/nome da especialização, peça somente esse dado e pare.
- Se a identidade do taxon for materialmente ambígua, peça uma única desambiguação e pare.
- Se uma fonte importante estiver inacessível, não interrompa a pesquisa inteira quando houver caminhos alternativos; registre a limitação.
- Se a evidência for insuficiente para uma conclusão, declare `inconclusivo` ou `hipótese`; não preencha a lacuna por plausibilidade.
- Se fontes competentes divergirem, registre a divergência e as condições de cada posição.

## 8. Evidência e validação

Antes de finalizar, confirme que:

- conclusões centrais possuem suporte verificável;
- afirmações temporais usam fontes suficientemente atuais para o tipo de achado;
- pontos regulatórios usam fonte competente sempre que disponível;
- páginas comerciais foram usadas como evidência de mensagem/comportamento do mercado, não como prova independente de seus próprios claims;
- linguagem de consumidor derivada de reviews/comunidades não foi generalizada sem triangulação;
- evidência, inferência e hipótese permanecem distinguíveis;
- conteúdo estrutural, semiestável e volátil está distinguível quando material;
- dimensões factuais variáveis não viraram fatos de cliente nem fields E20.2 por decisão da pesquisa;
- o relatório não contém wireframe, arquitetura de seções, copy pronta ou CTA pronto.

## 9. Critérios de sucesso

A pesquisa é considerada boa quando:

- um consumidor posterior consegue entender com profundidade como o público pensa e decide sem precisar reler dezenas de fontes;
- o relatório contém informação suficientemente específica para o taxon e evita generalidades aplicáveis a qualquer mercado;
- uma pesquisa de especialização é autossuficiente dentro do próprio escopo;
- o conhecimento permite usos diferentes conforme estágio/intenção sem prescrever uma página única;
- os pontos voláteis estão visíveis para possível atualização dinâmica posterior;
- lacunas e incertezas estão explícitas;
- o relatório aumenta inteligência persuasiva sem antecipar o trabalho criativo da geração.

## 10. Regra de concisão

Seja profundo sem ser repetitivo. Preserve nuance, evidência, exceções e diferenças entre públicos; remova introduções genéricas, explicações óbvias e duplicação. Não descreva seu raciocínio interno nem produza cadeia de pensamento; entregue somente conclusões, evidências, classificações e limitações verificáveis.
