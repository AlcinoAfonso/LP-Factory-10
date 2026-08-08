08/08/2026 — Rascunho vivo — E19.3 — Composição e geração de landing pages

## 0. Identificação

### 0.1. Estado do documento

- Status: debate em andamento.
- Natureza: rascunho vivo anterior ao plano-base v1.
- Este arquivo usa desde o início o path definitivo do futuro plano-base, mas seu conteúdo ainda não constitui v1 aprovada.
- Durante o debate, registrar somente definições aceitas pelo humano e questões ainda abertas que sejam necessárias ao fechamento do recorte.
- Ao encerrar o debate, este rascunho será consolidado como plano-base v1, sem criar arquivo paralelo.

### 0.2. Recorte e objetivo

- `E19.3 — Composição e geração da primeira LP real`.
- Objetivo do recorte: implementar o menor mecanismo universal capaz de transformar qualquer `landing_page` legítima em `draft`, já configurada pelo fluxo oficial, em uma landing page completa, real, visualizável e avaliável, compondo as fontes canônicas vigentes, determinando server-side sua estrutura efetiva, usando IA somente para gerar o conteúdo autorizado pelos contratos, validando deterministicamente o resultado e materializando conteúdo e proveniência suficientes para sua revisão humana.
- O mecanismo deve funcionar da mesma forma para qualquer taxon, plano e LP admitidos pelos contratos vigentes; diferenças de nicho entram somente pelas fontes canônicas responsáveis por essas diferenças.
- A primeira LP piloto é somente a primeira validação real desse mecanismo universal.
- O recorte termina com a LP ainda em `draft`; publicação, edição avançada, regeneração, tracking e demais evoluções não integram esse objetivo.
- Objetivo prioritário do projeto: chegar rapidamente à primeira landing page real gerada pelo fluxo oficial, preservando o princípio de menor solução suficiente sem criar solução descartável específica para o piloto.

### 0.3. Fontes obrigatórias do debate

- `README.md`.
- `docs/lp-planejamento.md`.
- `docs/roadmap.md`.
- `docs/template-roadmap.md`.
- `docs/base-tecnica.md`.
- `docs/schema.md`.
- Planos-base e implementação vigentes de E10.8, E18.4, E18.5, E20.2, E20.3, E19.1 e E19.2.
- Repositório `AlcinoAfonso/LP-Factory-10`.

## 1. Definições aceitas durante o debate

### 1.1. Natureza universal da E19.3

- A E19.3 deve criar um mecanismo universal de composição, geração, validação e materialização de `landing_page`.
- O contrato não pode conter regra de negócio específica do primeiro nicho, da conta piloto ou da primeira LP utilizada na validação.
- A mesma lógica deve funcionar para qualquer taxon e qualquer LP que chegue legitimamente ao recorte pelos contratos vigentes.
- Diferenças entre nichos devem entrar somente pelas fontes canônicas já responsáveis por essas diferenças, nunca por condicionais nominais introduzidas na E19.3.

### 1.2. Papel da primeira LP piloto

- A primeira LP real é o primeiro caso concreto de validação do mecanismo universal, não a referência arquitetural para desenhá-lo.
- O `draft` piloto serve para provar o fluxo oficial ponta a ponta e revelar bloqueios reais.
- Evidência encontrada no piloto pode justificar correção de contrato universal quando demonstrar um problema geral.
- Evidência exclusiva do nicho ou da conta piloto não autoriza regra específica dentro da E19.3.

### 1.3. Princípio de simplificação

- O critério macro permanece: incluir somente o que for indispensável para transformar um `draft` legítimo em uma landing page real e avaliável.
- Universal não significa genérico em excesso nem infraestrutura preventiva.
- O recorte deve ser pequeno, mas o pequeno contrato precisa ser reutilizável por qualquer LP futura que satisfaça as mesmas interfaces canônicas.
- Se uma capacidade puder ser adicionada depois sem retrabalho relevante, deve permanecer fora da primeira implementação.

### 1.4. Fronteira de composição

- A E19.3 compõe fontes vigentes e não reconstrói seus contratos.
- E10.8 permanece responsável pelas pesquisas estruturadas e sua resolução.
- E18.4 permanece responsável pela parametrização raiz de `landing_page`.
- E18.5 permanece responsável pelos módulos, variantes, fields e contratos estruturais.
- E20.2 permanece responsável pelo catálogo declarativo de entradas.
- E20.3 permanece responsável pelo perfil de orientação versionado.
- E19.2 permanece responsável pelos valores concretos configurados e pela associação ao `draft`.
- E9 permanece responsável por entitlement e plano efetivo; capabilities somente podem participar quando houver contrato concretamente admitido.

### 1.5. Autoridade estrutural

- A IA não escolhe taxon, plano, módulo, variante, versão, prioridade ou ordem.
- A seleção efetiva deve ser determinada server-side a partir dos contratos vigentes.
- Regras de seleção e aplicabilidade devem ser universais e derivadas dos contratos, sem condicionais por nicho.
- A função exata de prioridade, ordem, aplicabilidade e disponibilidade de valores ainda permanece em debate e não está fechada neste rascunho.

### 1.6. Lifecycle do `draft` e fronteira da publicação

- `draft` é estado de lifecycle, não sinônimo de LP incompleta.
- A E19.3 deve terminar com uma LP completa, funcional, visualizável e revisável, ainda em `draft`.
- Esse `draft` pode sofrer ajustes antes da publicação; o mecanismo de edição, regeneração, aprovação e versionamento desses ajustes não precisa ser antecipado na E19.3.
- Uma LP publicada também poderá evoluir futuramente, mas o contrato de alteração pós-publicação pertence a recorte posterior.
- Publicação permanece etapa separada da geração inicial em `draft`.

### 1.7. Experiência de geração

- Depois de a configuração aplicável estar completa, o fluxo oficial deve oferecer uma ação explícita para gerar a LP; o rótulo inicial pode ser `Gerar LP`.
- Para o usuário, a experiência pretendida é simples: configuração completa → `Gerar LP` → LP em `draft` disponível para visualização e revisão.
- O clique é somente o gatilho de uma execução server-side; a simplicidade da UX não reduz as validações e composições internas necessárias.
- A geração inicial é acionada pelo humano e não constitui automação recorrente ou processo autônomo.

### 1.8. Determinismo antes da IA

- A E19.3 deve usar determinismo em tudo que possa ser decidido objetivamente pelos contratos e dados vigentes.
- Antes da IA, o servidor deve resolver contexto, estrutura, fontes permitidas, valores concretos aplicáveis, fatos autorizados, evidências necessárias e bindings operacionais.
- A IA entra apenas onde há tarefa genuinamente generativa, principalmente síntese, linguagem e copy dentro dos limites resolvidos.
- Regra orientadora: se existe uma resposta correta derivável dos contratos e dos dados, o sistema decide; se existem várias formulações válidas e o valor está na comunicação, a IA decide dentro do pacote autorizado.
- A saída da IA volta a passar por validação determinística antes de qualquer materialização.

### 1.9. Ponte determinística entre E18.5 e E20.2

- A E18.5 define o que cada módulo e field admite: estrutura, cardinalidade, política, fontes de pesquisa, suporte ou evidência operacional e bindings já explicitamente contratados.
- A E20.2 define quais dados concretos existem: `fieldKey`, escopo, origem, obrigação, aplicabilidade, validação e valores resolvidos pela jornada da E19.
- A E19.3 é responsável por resolver, para cada módulo/field efetivamente selecionado, quais valores concretos da E20.2 são pertinentes e autorizados a compor o pacote de geração daquela LP.
- A IA não consulta a E20.2 diretamente nem decide livremente quais dados concretos usar; recebe somente o pacote previamente resolvido.
- Não criar preventivamente uma matriz ou catálogo completo `field E18.5 ↔ fieldKey E20.2`.
- A primeira implementação deve materializar somente as regras de composição exigidas pelos fields realmente consumidos pela geração universal.
- Ausência de suporte factual retira autorização para a afirmação correspondente; field técnico permanece server-side; action usa binding operacional vigente; estrutura incompatível ou suporte indispensável ausente deve seguir regra determinística de seleção, omissão ou falha a ser fechada no debate.

### 1.10. Unidade do recorte E19.3

- Composição determinística, geração estruturada, validação, materialização e visualização permanecem no mesmo recorte E19.3, em fases internas separadas.
- Não criar E19.4 apenas para deslocar a geração neste momento.
- A composição determinística possui consumidor imediato na própria geração e ainda não demonstrou lifecycle, persistência, operação, autoridade ou consumidores independentes.
- A separação futura só deve ser reavaliada se surgir evidência real de contrato autônomo, como registry versionado próprio de bindings, lifecycle independente, consumidores externos, liberação independente ou matriz material de compatibilidade que não possa ser derivada dos contratos atuais.
- Tamanho de código ou quantidade de arquivos, isoladamente, não justificam novo recorte.

## 2. Questões ainda abertas para o debate

### 2.1. Composição mínima

- Definir o pacote autoritativo mínimo que a E19.3 precisa resolver antes de chamar a IA.
- Definir quais informações são somente referência runtime e quais precisam integrar o snapshot da geração.

### 2.2. Seleção estrutural universal

- Definir o menor algoritmo determinístico para transformar perfil + catálogo + valores + pesquisas + raiz em composição efetiva.
- Definir a função de `P1`, `P2`, `P3` sem calibrar a regra a partir do primeiro caso piloto.
- Definir tratamento universal para recomendação estrutural incompatível com valores concretos ou interaction contracts.

### 2.3. Resolução mínima E18.5 ↔ E20.2

- Definir a menor regra universal que cruza política/fonte/suporte do field com os valores concretos aplicáveis da E20.2 sem criar terceiro catálogo preventivo.
- Definir quando um valor E20.2 é apenas contexto factual, quando pode orientar copy e quando deve permanecer exclusivamente server-side.
- Definir regra de seleção, omissão ou falha quando o módulo/field exigir suporte concreto inexistente.

### 2.4. Papel mínimo da IA e contrato de saída

- O fluxo linear `pacote resolvido → geração estruturada → validação determinística → candidata` é a direção inicial aceita.
- Definir exatamente quais fields podem ser preenchidos pela IA e quais valores permanecem exclusivamente server-side.
- Definir o menor formato estruturado capaz de representar somente o conteúdo dos módulos previamente selecionados.
- Preservar HTML, CSS, JSX, identidades estruturais, destinos operacionais e fatos não fornecidos fora da autoridade da IA.

### 2.5. Materialização e visualização

- Definir a menor materialização durável vinculada à LP que permita visualizar a página real sem antecipar editor, publicação ou versionamento editorial completo.
- Não presumir tabela, coluna, renderer ou rota antes da avaliação estrutural e do estado real do repositório.

### 2.6. Snapshot

- Definir o mínimo suficiente para reproduzir e explicar uma geração sem copiar registries completos, fontes não utilizadas, prompts integrais, respostas brutas inválidas ou secrets.

### 2.7. Revisão humana

- Definir apenas a experiência mínima para visualizar e avaliar a primeira geração.
- Edição, regeneração, workflow de aprovação e publicação permanecem fora enquanto não forem indispensáveis.

## 3. Escopo negativo preservado durante o debate

- publicação pública;
- domínio customizado;
- tracking;
- Analytics/dashboard;
- CRM;
- A/B test;
- Google Ads;
- editor drag-and-drop;
- múltiplos templates preventivos;
- otimização da E19.2;
- onboarding com IA;
- nova capability comercial;
- disponibilidade comercial `taxon + plano`;
- agente;
- memória de IA;
- job;
- automação recorrente;
- infraestrutura nova apenas para evolução futura;
- regra específica da conta piloto ou de um nicho dentro do mecanismo universal da E19.3;
- novo E18.6 apenas para acoplar módulos diretamente ao catálogo E20.2 sem evidência real de autonomia;
- catálogo ou matriz preventiva completa de bindings E18.5 ↔ E20.2;
- E19.4 criado apenas para separar a geração sem evidência de contrato autônomo.

## 4. Registro do processo do rascunho

### 4.1. Regra de evolução

- Cada decisão aceita no debate deve ser incorporada neste mesmo arquivo.
- Questão resolvida deve sair da seção de questões abertas e entrar na seção correspondente de definições aceitas.
- As atualizações do rascunho podem consolidar blocos de decisões do debate, evitando mutação documental a cada intervenção isolada.
- Não criar plano-base paralelo ao final do debate.
- O encerramento do debate transforma este conteúdo consolidado em plano-base v1 e completa as quatro seções canônicas exigidas pelo `docs/prompt-estrategista.md`.
