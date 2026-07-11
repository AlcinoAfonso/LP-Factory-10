## Nota de supersedência — 11/07/2026

Este documento é histórico e registra o debate que originou o planejamento de LPs.

As decisões conceituais consolidadas foram migradas para `docs/lp-planejamento.md`.

Manter este arquivo apenas como rastreabilidade do raciocínio.

Em caso de conflito, usar `docs/lp-planejamento.md` como referência conceitual mais atual.

01/07/2026 — Lousa debate landing pages
Fontes: chat, docs/roadmap.md, docs/schema.md, Supabase real, GitHub

1. Objetivo da lousa

Registrar o entendimento gradual sobre como landing pages devem ser formadas no LP Factory 10.

A lousa serve para separar conceitos antes de decidir implementação:

* template
* família de template
* módulos/seções
* composição
* itens estruturais
* regras por seção
* design
* artefato final
* futura edição pelo cliente/admin

Esta lousa não implementa nada e não altera o roadmap.

2. Premissa inicial

A landing page é o core do produto.

A estrutura precisa permitir variação real entre nichos, sem criar um template novo para cada nicho.

Exemplo:

* alguns nichos podem precisar de 8 seções
* outros nichos podem precisar de 10 ou mais seções
* alguns nichos podem exigir seções específicas
* outros nichos podem dispensar essas seções

Portanto, não é correto tratar o template de landing page como uma página fixa com quantidade e ordem imutável de seções.

3. Papel do template

Template não é a landing page pronta.

Template também não deve ser reduzido apenas a espaçamento, largura ou tracking.

O papel do template é definir a base técnica e estrutural permitida para um tipo de entrega.

O template pode definir:

* família/canal atendido
* renderer ou motor visual compatível
* contrato técnico da página
* módulos compatíveis
* limites visuais e responsivos
* versionamento da estrutura
* validações mínimas de publicação
* rastreabilidade da estrutura usada

O template não deve decidir sozinho:

* quantas seções cada nicho terá
* qual ordem final das seções
* quais seções serão obrigatórias em cada nicho
* qual copy será usada em cada seção
* quais seções o cliente poderá remover ou adicionar

4. Famílias de template

Família de template agrupa templates do mesmo tipo de entrega ou canal.

Famílias atuais/possíveis:

* commercial_activation
* landing_page
* email
* whatsapp
* instagram
* tiktok

Para o MVP, pode existir uma base inicial por família.

A arquitetura conceitual não deve afirmar que cada família terá para sempre apenas um template.

Uma família pode evoluir para vários templates quando houver necessidade real.

Exemplo futuro em landing_page:

* landing_page_default
* landing_page_bofu
* landing_page_lead_capture
* landing_page_service
* landing_page_product
* landing_page_event

5. Situação atual do banco

No banco atual, content_templates guarda tanto templates de página quanto módulos/seções.

content_templates usa:

* template_family
* template_scope
* template_key
* version
* status
* is_active
* payload_json

No estado atual, há registros da família commercial_activation:

* 1 template de página
* 8 módulos/seções

Os módulos/seções atuais de commercial_activation são:

* hero
* benefits
* services
* plans
* differentials
* how_it_works
* faq
* final_cta

A família landing_page ainda não deve ser considerada resolvida por esse recorte.

6. Módulos e seções

Para entendimento estratégico, módulo e seção podem ser tratados como conceitos próximos.

A distinção útil é:

* módulo = peça reutilizável disponível no sistema
* seção = uso concreto desse módulo dentro de uma página

Exemplo:

* hero é um módulo disponível
* a Hero da LP de harmonização facial é uma seção concreta

Módulos/seções são as peças usadas para montar landing pages.

Exemplos possíveis:

* Hero
* Problema
* Benefícios
* Procedimentos
* Serviços
* Oferta
* Planos
* Prova social
* Antes e depois
* Autoridade
* Segurança
* Processo
* FAQ
* CTA final
* Localização
* Formulário

7. Composição

Composição é a camada que organiza a página concreta.

Ela deve definir:

* quais módulos entram
* em qual ordem
* quais são obrigatórios
* quais são opcionais
* qual variante de cada módulo será usada
* qual contexto ou nicho está sendo atendido

No banco atual, isso corresponde principalmente a:

* content_template_compositions
* content_template_composition_items

A composição é o lugar mais adequado para responder perguntas como:

* quais seções entram na LP de harmonização facial?
* em que ordem elas aparecem?
* quais seções são obrigatórias?
* quais seções podem ser removidas?
* qual variante de Hero será usada?
* qual variante de prova social será usada?

8. Exemplo conceitual de composição por nicho

Harmonização facial poderia ter uma composição inicial com:

* Hero
* Problema/desejo
* Benefícios
* Procedimentos
* Antes e depois
* Segurança
* Prova social
* FAQ
* CTA WhatsApp

Advogado trabalhista poderia ter outra composição inicial com:

* Hero
* Situações atendidas
* Direitos do trabalhador
* Como funciona
* Autoridade
* FAQ
* CTA

Isso mostra que o template não deve impor a mesma sequência para todos os nichos.

O template permite possibilidades controladas.

A composição escolhe a montagem concreta.

9. Itens estruturais

Itens estruturais são a base estratégica usada para definir copy, argumento, seção e possivelmente design.

Exemplos de itens estruturais:

* dores
* desejos
* desejos ocultos
* objeções
* riscos percebidos
* mecanismos de solução
* provas disponíveis
* diferenciais
* critérios de decisão
* urgências
* perguntas frequentes
* barreiras de conversão
* linguagem do público
* nível de consciência
* sofisticação do mercado

Esses itens devem alimentar a geração e revisão das seções.

10. Regras por seção

Cada seção deve ter regras próprias sobre quais itens estruturais pode ou deve usar.

Exemplo conceitual:

Hero title pode usar:

* dor principal
* desejo principal
* desejo oculto
* transformação central

Hero subtitle pode usar:

* título
* público
* mecanismo
* objeção principal
* contexto de decisão

FAQ pode usar:

* objeções
* riscos percebidos
* dúvidas práticas
* barreiras de compra

Prova social pode usar:

* provas disponíveis
* autoridade
* diferenciais verificáveis
* redução de risco

CTA final pode usar:

* desejo principal
* urgência legítima
* próximo passo claro
* canal de conversão

Essa camada ainda precisa ser melhor definida antes de virar implementação.

11. Qualidade da copy

A qualidade da copy não deve depender apenas de um prompt genérico.

O sistema precisa saber:

* qual seção está sendo escrita
* qual campo está sendo escrito
* quais itens estruturais alimentam esse campo
* quais limites editoriais aplicar
* quais exageros evitar
* quais critérios tornam a copy publicável

Exemplo:

O título da Hero não deve nascer de todos os dados disponíveis.

Ele deve nascer de um subconjunto estratégico adequado ao campo.

12. Limites editoriais

Limites editoriais devem ser avaliados antes de virar regra definitiva.

Hipótese inicial:

* Hero title: curto, direto e assertivo
* Hero subtitle: complementar ao título
* títulos de seção: objetivos e escaneáveis
* cards: título curto e descrição clara
* FAQ: pergunta direta e resposta curta

Não definir ainda limites universais fechados.

Possíveis parâmetros futuros:

* mínimo e máximo de caracteres
* quantidade máxima de linhas
* tom permitido
* nível de promessa
* palavras proibidas
* exigência de prova
* clareza do CTA
* aderência ao público

Esses parâmetros podem precisar ser configuráveis no Admin Dashboard.

13. Design da landing page

O design não deve ser definido apenas pelo template.

O design deve nascer da combinação de:

* design system global
* template de página
* variante do módulo
* composição
* características do nicho
* itens estruturais
* configuração visual permitida

Exemplo:

Harmonização facial pode exigir uma apresentação mais visual, leve, estética e premium.

Advogado trabalhista pode exigir uma apresentação mais sóbria, direta e baseada em confiança.

Isso não obriga um template novo por nicho.

Pode ser:

* mesmo template-base
* composição diferente
* variantes diferentes
* configuração visual diferente
* conteúdo diferente

14. Cliente/admin alterando a página

A ideia futura é que o sistema gere uma composição default por nicho/contexto.

Depois, cliente ou admin poderia ajustar dentro de limites seguros:

* remover seção
* adicionar seção compatível
* alterar ordem
* trocar variante
* editar copy
* ajustar configuração visual permitida

Isso se aproxima do LP Builder e não deve ser antecipado dentro da E18 sem recorte próprio.

15. Artefato final

Artefato final é a landing page gerada, revisada ou publicada.

Ele deve preservar:

* template usado
* composição usada
* taxon/nicho
* conteúdo final
* versão do template
* versão da composição
* versão da pesquisa
* fontes estruturais usadas
* status do conteúdo

No banco atual, essa camada corresponde principalmente a:

* content_artifacts
* content_artifact_research_sources

16. Lógica resumida

Template = base técnica e possibilidades controladas.

Módulos/seções = peças disponíveis.

Composição = montagem concreta por nicho/contexto.

Itens estruturais = inteligência estratégica que alimenta copy, argumentos e design.

Regras por seção = contrato que diz como cada seção deve usar os itens estruturais.

Artefato final = landing page pronta/publicada com conteúdo, versões e fontes.

17. Ponto ainda não resolvido

Ainda falta definir uma camada clara para governança editorial e estratégica por seção.

Perguntas abertas:

* onde ficam as regras por seção?
* essas regras pertencem ao template, à composição, a uma tabela própria ou a configuração administrativa?
* como mapear itens estruturais para cada campo?
* como validar copy antes de publicar?
* quais parâmetros o Admin Dashboard poderá alterar?
* como evitar que isso vire overengineering?
* em que momento isso se conecta ao LP Builder?

18. Direção provisória

Não transformar E18 em arquitetura multicanal completa.

Não puxar LP Builder para dentro da E18.

Não decidir schema novo ainda.

Usar esta lousa para consolidar entendimento antes de criar plano-base.

A próxima etapa deve ser continuar debatendo a formação das landing pages e só depois transformar em plano técnico.

19. Módulos, variantes e seções

Entendimento aprovado nesta etapa:

A solução recomendada para variações como Hero com imagem, Hero com formulário ou Hero centralizada é usar módulo semântico + variante + slots/configuração.

Não criar uma família para cada módulo neste momento.

Não tratar variações como herança rígida pai/filho.

O módulo define a função semântica da seção.

Exemplos:

* hero
* benefits
* faq
* final_cta

A variante define a forma estrutural do módulo.

Exemplos:

* hero.with_image
* hero.with_form
* hero.centered
* hero.with_video

Slots/configuração completam a seção.

Exemplo conceitual de hero.with_image:

* title
* subtitle
* proof_line
* primary_cta
* secondary_cta
* image

Exemplo conceitual de hero.with_form:

* title
* subtitle
* proof_line
* form
* privacy_note
* submit_label

A composição escolhe qual variante será usada em cada nicho ou contexto.

Exemplo:

* harmonização facial pode usar hero.with_image
* captação direta de orçamento pode usar hero.with_form
* página institucional simples pode usar hero.centered

Essa lógica já é compatível com a estrutura atual do projeto, porque content_template_composition_items já possui:

* module_template_id
* variant_key
* sort_order
* is_required
* config_json

Leitura prática:

* module_template_id identifica o módulo usado
* variant_key identifica a variante escolhida
* sort_order define a posição da seção
* is_required define obrigatoriedade
* config_json permite ajustes controlados

Portanto, para landing pages, a direção provisória é:

módulo base → variante → slots/configuração → composição → seção final

Essa decisão não exige criar schema novo agora.

A próxima dúvida a resolver é onde ficam os contratos de slots, regras editoriais e critérios de compatibilidade entre nicho, módulo e variante.

20. Zod e contrato executável

O Zod já existe no projeto no recorte commercial_activation.

Ele aparece como validação server-side de conteúdo, schemas por variante e registry que liga variant_key a moduleKey e schema correspondente.

O Zod entra na camada técnica do debate:

módulo → variante → slots/conteúdo → validação → renderização segura

O Zod agrega:

* validação antes de publicar
* bloqueio de conteúdo malformado
* limites de caracteres por campo
* campos obrigatórios e opcionais
* formatos seguros de CTA, listas, cards e URLs
* objetos estritos
* tipos TypeScript derivados do schema
* validação de saída gerada por IA
* validação do content_json antes de renderizar

O Zod não decide estratégia.

Ele não escolhe:

* qual variante usar por nicho
* quais seções entram na página
* se a copy é persuasiva
* se o argumento comercial é bom
* se o design combina com o mercado

Conclusão provisória:

Zod é contrato executável de segurança, formato e consistência.

Zod não substitui parametrização editorial, composição, pesquisa estruturada nem revisão estratégica.

21. Parametrização de módulos e variantes

Termo adotado nesta lousa:

Parametrização = definição prática dos limites e regras de um módulo ou variante.

Parametrizar um módulo/variante significa definir:

* campos aceitos
* campos obrigatórios
* limites de caracteres
* quantidade mínima e máxima de itens
* tipos de CTA permitidos
* imagem, vídeo ou formulário permitido
* regras editoriais
* critérios de validação
* critérios mínimos para publicação

Na prática, a parametrização de qualidade precisa ser feita por variante relevante.

Mas isso não significa começar do zero em todas.

Direção provisória:

* criar defaults por tipo de campo
* especializar por variante
* ajustar por evidência real

Exemplos de defaults:

* título curto
* subtítulo
* descrição
* CTA
* card
* pergunta e resposta
* lista de benefícios

Exemplos de especialização:

* hero.with_image usa título, subtítulo, CTA e imagem
* hero.with_form usa título, subtítulo, formulário e nota de privacidade
* faq.accordion usa perguntas e respostas
* benefits.cards usa cards curtos

A baixa qualidade observada nas páginas comerciais indica provável falta de parametrização editorial por seção/campo.

O problema não parece ser apenas ausência de validação técnica.

Validação técnica evita conteúdo quebrado.

Parametrização editorial orienta qualidade, foco, tom, promessa, limite e utilidade da copy.

22. Local da parametrização

Estado atual entendido:

A parametrização técnica crítica está principalmente no código do repositório.

Exemplos:

* schemas Zod em commercial_activation
* registry de variantes
* resolver
* renderer
* validações server-side

Não tratar como já existente uma parametrização editorial editável no Admin Dashboard.

Para o MVP, a direção mais segura é manter parametrizações críticas no repo.

Admin Dashboard pode expor ajustes simples no futuro, desde que haja:

* preview seguro
* validação clara
* rollback ou recuperação
* limites de permissão
* baixo risco de quebrar renderização

Evitar, neste momento, transformar o Admin em editor livre de contratos de módulo, variantes ou schemas.

Isso aumentaria muito a superfície do MVP.

23. Reuso de módulos entre canais

A preocupação com retrabalho é válida.

Se cada canal redesenhar do zero todos os módulos, variantes, slots, limites e validações, o trabalho aumenta muito.

Mas também não é seguro criar um módulo universal que sirva automaticamente para todos os canais.

Canais diferentes têm restrições diferentes.

Exemplos:

* landing page usa layout, imagem, formulário, CTA e responsividade
* página comercial usa estrutura web próxima de landing page, mas vende o próprio LP Factory
* e-mail usa assunto, preheader, corpo textual e CTA simples
* WhatsApp usa sequência conversacional, mensagem curta e CTA textual
* Instagram/TikTok usam formatos próprios de hook, cena, legenda, slide ou roteiro

Direção provisória:

Não criar catálogo universal prematuro.

Não duplicar tudo sem necessidade comprovada.

Manter módulos por família/canal no MVP, com reuso conceitual e eventual reaproveitamento de código quando houver compatibilidade real.

Página comercial e landing page são canais próximos e podem compartilhar ideias, componentes ou padrões web quando fizer sentido.

Mas não assumir que commercial_activation.hero.default serve automaticamente para landing_page.

E-mail e WhatsApp podem reaproveitar lógica estratégica, mas provavelmente exigem contratos e renderização próprios.

24. Camada intermediária e ROI

Foi discutida a possibilidade de uma camada intermediária baseada em conceito-base de módulo.

Exemplo:

* Hero como conceito-base
* Hero web
* Hero e-mail
* abertura de WhatsApp inspirada no Hero

Essa camada poderia reduzir duplicação no futuro.

Mas ela não está explicitamente consolidada hoje no projeto como arquitetura formal.

Criá-la agora provavelmente significaria nova arquitetura ou retrabalho.

Avaliação provisória de ROI para o MVP:

Baixo neste momento.

Motivos:

* a qualidade da página comercial ainda precisa ser estabilizada
* landing_page ainda não foi trabalhada como consumidor real
* adaptação entre canais exige IA ou regras editoriais fortes
* Admin editável para parametrização aumentaria complexidade
* o ganho de reuso ainda é hipotético

Melhor momento para reavaliar:

* após página comercial funcionando bem
* após primeira LP real do produto
* após segundo nicho validado
* quando houver duplicação real comprovada

Conclusão provisória:

Não criar camada intermediária agora.

Registrar como possibilidade futura condicionada a ROI real.

25. Dogfooding, páginas comerciais e LPs próprias

Termo correto em inglês:

eat your own dog food

Termo curto comum:

dogfooding

Uso nesta lousa:

usar o próprio SaaS para construir nossas próprias landing pages.

Estratégicamente, páginas comerciais por nicho poderiam se aproximar de LPs próprias do LP Factory, principalmente quando usam audience_scope business_buyer e itens estruturais para vender o próprio produto.

Mas o projeto atual separa E10.7 e E19.

E10.7 cuida de páginas comerciais personalizadas por nicho.

E19 é o LP Builder planejado.

Converter agora páginas comerciais em LPs reais do Builder não está previsto no recorte atual.

Isso provavelmente geraria retrabalho para o MVP.

Direção provisória:

Não mexer nisso agora.

Manter páginas comerciais e LP Builder separados no MVP.

Usar o aprendizado das páginas comerciais para informar a futura LP real, sem fundir os recortes antes de decisão humana.

26. Síntese provisória pós-debate

A direção atual da lousa é:

* manter módulos por família/canal no MVP
* usar variantes por módulo
* usar parametrização por variante
* manter parametrização técnica crítica no repo
* usar Zod como contrato executável de validação
* não abrir Admin editável para contratos complexos neste momento
* não criar camada intermediária transversal agora
* não transformar páginas comerciais em LPs do Builder agora
* reavaliar reuso mais amplo somente com evidência de ROI

Próximo ponto relevante do debate:

Definir como deveria ser a parametrização editorial de uma seção concreta, começando pela Hero.

27. Parametrização técnica e editorial por seção/campo

A diferença principal é:

Parametrização técnica responde se o conteúdo pode ser salvo, validado e renderizado sem quebrar.

Parametrização editorial responde se o campo foi escrito com a estratégia correta para aquela seção.

Parametrização técnica define:

* formato dos dados
* campos obrigatórios
* campos opcionais
* tipos aceitos
* limites mínimos e máximos
* URL ou CTA seguro
* arrays mínimos e máximos
* variante conhecida
* compatibilidade de renderização

Exemplo na Hero:

* title existe e está dentro do limite
* description existe e está dentro do limite
* primary_cta tem label e href válido
* objeto não traz campos inesperados
* variant_key é conhecido

No projeto, essa camada está principalmente nos schemas Zod, registry, resolver, renderer e validações server-side.

Parametrização editorial define:

* quais itens estruturais cada campo deve consultar
* quais blocos de pesquisa são fonte principal ou secundária
* quais item_key são permitidos ou evitados
* qual tom usar
* qual tipo de promessa é aceitável
* qual relação o campo deve ter com dor, desejo, benefício, mecanismo, objeção ou prova
* quais exageros evitar
* quais critérios tornam a copy forte o suficiente

Exemplo na Hero title:

* pode usar dor principal
* pode usar desejo principal
* pode usar desejo oculto
* pode usar transformação central
* pode consultar strategic_core e lp_sections
* não deve depender de SEO como fonte principal
* não deve transformar medo em promessa exagerada

Exemplo na Hero subtitle:

* deve complementar o title
* pode explicar mecanismo
* pode contextualizar público
* pode reduzir objeção principal
* deve dar clareza para decisão

Leitura prática:

* técnico = a seção está válida?
* editorial = a seção está boa?
* técnico evita quebra
* editorial evita copy genérica ou fraca

A qualidade das páginas comerciais depende especialmente da parametrização editorial por seção/campo.

Essa camada deve conectar os itens estruturais existentes no Supabase à geração de copy pela IA.

Direção provisória:

* manter validação técnica no repo
* começar parametrização editorial no repo
* só mover parte da parametrização editorial para banco/Admin quando houver preview, validação, versionamento, rollback e ROI comprovado

Próximo ponto relevante do debate:

Parametrizar editorialmente a Hero.

28. Curadoria no Admin antes de liberar nicho para LPs

Decisão de direção após debate:

A composição de landing pages reais de clientes não deve seguir o modelo rígido de commercial_activation.

A página comercial atual pode permanecer determinística, mas landing_page precisa de composição flexível por nicho, orientada por itens estruturais e validada contra o catálogo real de módulos e variantes.

Caminho selecionado para sair do debate e seguir para plano-base:

Curadoria no Admin antes de liberar o nicho.

Fluxo conceitual aprovado:

* taxon definido
* itens estruturais completos
* Admin aciona IA para sugerir composição do nicho
* IA sugere seções, ordem, variantes, obrigatoriedade e possíveis lacunas
* sistema confronta a sugestão com módulos, variantes, schemas e renderers disponíveis
* humano decide o que aprovar, remover, adiar, parametrizar ou implementar
* composição aprovada vira default oficial do nicho
* LP teste é gerada com conta teste
* nicho só é liberado para clientes depois de validação mínima

Papel da IA:

* sugerir composição com base nos itens estruturais do nicho
* justificar seções sugeridas
* apontar módulos faltantes ou parametrizações fracas
* apoiar geração posterior de copy

Papel do sistema:

* validar se módulos e variantes existem
* validar se há contrato técnico e renderer compatível
* impedir persistência de composição inválida
* gravar somente composição aprovada
* manter rastreabilidade de template, composição, taxon e versões

Papel humano:

* aprovar ou ajustar a composição sugerida
* decidir se módulo faltante tem ROI
* decidir se uma sugestão da IA deve virar implementação
* validar LP teste antes de liberar o nicho

Modelo de planos-base aprovado para próxima etapa:

* Plano-base 1: base de composição landing_page, principalmente ligado à E18
* Plano-base 2: curadoria de composição no Admin, principalmente ligada à E12 com dependência da E18
* Plano-base 3: LP teste e liberação do nicho, principalmente ligada à E19 com dependências de E18 e E12

Direções aceitas:

* usar mais de um plano-base
* começar com esses três planos-base
* não enquadrar tudo em E10.7, porque E10.7 é página comercial
* começar a factibilidade pelo Admin Dashboard apoiando o fluxo
* manter fases objetivas para implementação e detalhadas o suficiente para avaliação dos especialistas
* se a execução revelar nova fase necessária, seguir o fluxo do prompt-estrategista para ajuste controlado

Próxima ação:

Sair do debate para planos-base separados, delegando dois planos-base a outros chats e assumindo o primeiro neste chat, quando houver comando humano explícito.
